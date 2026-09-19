"""Pillar cobro: #7 DSO real, #8 tramo +90 días y su Δ3m, #9 caída del cliente top."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.config import EXTRACTION_DATE
from ml_service.pulse.features.months import (
    LAST_INDEX,
    delta,
    month_from_index,
    month_index,
    rolling_sum,
    rolling_weighted_mean,
)

TOP_WINDOW = 12
GROWTH_CLIP = 1.0


def open_receivables_by_month(ar: pl.DataFrame) -> pl.DataFrame:
    """Explode each receivable over the month-ends at which it is still open.

    An invoice is open at the end of every month from its issuance month up to
    the month before it is settled (unsettled invoices stay open to the end).
    """
    close = pl.coalesce(pl.col("payment_date"), pl.lit(EXTRACTION_DATE))
    ar = ar.with_columns(
        month_index("issuance_date").alias("_m0"),
        pl.min_horizontal(month_index(close) - 1, LAST_INDEX).alias("_m1"),
    ).filter(pl.col("_m1") >= pl.col("_m0"))
    ar = ar.with_columns(
        pl.int_ranges(pl.col("_m0"), pl.col("_m1") + 1).alias("_mi")
    ).explode("_mi")
    return ar.with_columns(month_from_index("_mi").alias("month")).drop(
        "_m0", "_m1", "_mi"
    )


def receivables_features(inv: pl.DataFrame, grid: pl.DataFrame) -> pl.DataFrame:
    """Add ``dso_days``, ``ar90_share``, ``ar90_d3``, ``top_client_growth`` to the grid."""
    ar = inv.filter(pl.col("side") == "ar")
    paid = ar.filter(pl.col("payment_date").is_not_null()).with_columns(
        (pl.col("payment_date") - pl.col("issuance_date"))
        .dt.total_days()
        .cast(pl.Float64)
        .alias("days"),
        pl.col("payment_date").dt.truncate("1mo").alias("month"),
    )
    dso = paid.group_by("company_id", "month").agg(
        (pl.col("days") * pl.col("amount_eur")).sum().alias("dso_num"),
        pl.col("amount_eur").sum().alias("dso_den"),
    )
    opened = open_receivables_by_month(ar.filter(pl.col("due_date").is_not_null()))
    month_end = pl.col("month").dt.offset_by("1mo")
    over90 = (month_end - pl.col("due_date")).dt.total_days() > 90
    bucket = opened.group_by("company_id", "month").agg(
        pl.col("amount_eur").sum().alias("ar_open"),
        pl.when(over90)
        .then(pl.col("amount_eur"))
        .otherwise(0.0)
        .sum()
        .alias("ar_open_90"),
    )
    issued = (
        ar.filter(pl.col("counterparty_id").is_not_null())
        .group_by(
            "company_id",
            "counterparty_id",
            pl.col("issuance_date").dt.truncate("1mo").alias("month"),
        )
        .agg(pl.col("amount_eur").sum().alias("billed"))
    )
    top = _top_client_growth(issued, grid)
    panel = (
        grid.join(dso, on=["company_id", "month"], how="left")
        .join(bucket, on=["company_id", "month"], how="left")
        .join(top, on=["company_id", "month"], how="left")
        .sort("company_id", "month")
        .with_columns(
            rolling_weighted_mean("dso_num", "dso_den", 3).alias("dso_days"),
            pl.when(pl.col("ar_open") > 0)
            .then(pl.col("ar_open_90") / pl.col("ar_open"))
            .otherwise(None)
            .alias("ar90_share"),
        )
        .with_columns(delta("ar90_share", 3).alias("ar90_d3"))
    )
    return panel.drop("dso_num", "dso_den", "ar_open", "ar_open_90")


def _top_client_growth(issued: pl.DataFrame, grid: pl.DataFrame) -> pl.DataFrame:
    """Growth of billing to the top customer (trailing 3m vs previous 3m), top chosen on trailing 12m."""
    dense = (
        grid.select("company_id", "month")
        .join(issued.select("company_id", "counterparty_id").unique(), on="company_id")
        .join(issued, on=["company_id", "counterparty_id", "month"], how="left")
        .sort("company_id", "counterparty_id", "month")
        .with_columns(
            rolling_sum(
                "billed", TOP_WINDOW, by=("company_id", "counterparty_id")
            ).alias("b12"),
            rolling_sum("billed", 3, by=("company_id", "counterparty_id")).alias("b3"),
        )
        .with_columns(
            pl.col("b3").shift(3).over("company_id", "counterparty_id").alias("b3_prev")
        )
    )
    top = dense.filter(
        pl.col("b12") == pl.col("b12").max().over("company_id", "month")
    ).unique(subset=["company_id", "month"], keep="first")
    growth = (
        pl.when(pl.col("b3_prev").is_null() | (pl.col("b3_prev") <= 0))
        .then(None)
        .otherwise(
            pl.max_horizontal(
                pl.min_horizontal(
                    (pl.col("b3") - pl.col("b3_prev")) / pl.col("b3_prev"), GROWTH_CLIP
                ),
                -GROWTH_CLIP,
            )
        )
    )
    return top.select(
        "company_id",
        "month",
        growth.alias("top_client_growth"),
        pl.col("counterparty_id").alias("top_client_id"),
    )
