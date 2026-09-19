"""Pillar deuda: #3 utilización de líneas, #4 aceleración, #10 vencimientos sobre caja."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.config import (
    CREDIT_LINE_TYPES,
    DEBT_SERVICE_CATEGORIES,
    DEBT_TYPES,
)
from ml_service.pulse.features.months import delta, rolling_sum

MAX_UTIL = 1.5
MAX_MATURITY_RATIO = 12.0


def _line_limits(debt_products: pl.DataFrame, balances: pl.DataFrame) -> pl.DataFrame:
    """Per credit line: ``limit`` (granted) and ``drawn_now`` (|outstanding|), in native units."""
    lines = debt_products.filter(pl.col("type").is_in(CREDIT_LINE_TYPES)).select(
        "product_id",
        "company_id",
        limit=pl.col("granted").abs(),
        drawn_now=pl.col("outstanding").abs().fill_null(0.0),
    )
    snap = balances.select("product_id", snap_limit=pl.col("granted").abs())
    return (
        lines.join(snap, on="product_id", how="left")
        .with_columns(pl.coalesce(pl.col("limit"), pl.col("snap_limit")).alias("limit"))
        .filter(pl.col("limit") > 0)
        .drop("snap_limit")
    )


def _monthly_drawn(tx: pl.DataFrame, lines: pl.DataFrame) -> pl.DataFrame:
    """Month-end drawn amount per line, walking back from today's outstanding with the line's flows."""
    flows = (
        tx.filter(pl.col("product_id").is_in(lines["product_id"]))
        .group_by("product_id", pl.col("date").dt.truncate("1mo").alias("month"))
        .agg(pl.col("amount_eur").sum().alias("net"))
        .sort("product_id", "month", descending=[False, True])
    )
    after = pl.col("net").cum_sum().over("product_id") - pl.col("net")
    flows = flows.join(
        lines.select("product_id", "company_id", "drawn_now", "limit"), on="product_id"
    )
    # balance on a credit line is -drawn; inflows reduce the drawn amount
    return flows.with_columns(
        pl.max_horizontal(pl.col("drawn_now") + after, 0.0).alias("drawn")
    ).select("company_id", "product_id", "month", "drawn", "limit")


def credit_line_features(
    tx: pl.DataFrame,
    debt_products: pl.DataFrame,
    balances: pl.DataFrame,
    grid: pl.DataFrame,
) -> pl.DataFrame:
    """Add ``loc_util``, ``loc_util_d3``, ``loc_accel`` (null for companies without lines)."""
    lines = _line_limits(debt_products, balances)
    drawn = _monthly_drawn(tx, lines)
    limits = lines.group_by("company_id").agg(
        pl.col("limit").sum().alias("limit_total")
    )
    monthly = drawn.group_by("company_id", "month").agg(
        pl.col("drawn").sum().alias("drawn_total")
    )
    panel = grid.join(limits, on="company_id", how="left").join(
        monthly, on=["company_id", "month"], how="left"
    )
    panel = panel.sort("company_id", "month").with_columns(
        pl.col("drawn_total").fill_null(strategy="forward").over("company_id")
    )
    util = pl.min_horizontal(
        pl.col("drawn_total").fill_null(0.0) / pl.col("limit_total"), MAX_UTIL
    )
    panel = panel.with_columns(
        pl.when(pl.col("limit_total") > 0).then(util).otherwise(None).alias("loc_util")
    )
    panel = panel.with_columns(delta("loc_util", 3).alias("loc_util_d3"))
    return panel.with_columns(delta("loc_util_d3", 3).alias("loc_accel")).drop(
        "limit_total", "drawn_total"
    )


def maturity_features(
    tx: pl.DataFrame, debt_products: pl.DataFrame, panel: pl.DataFrame
) -> pl.DataFrame:
    """Add ``maturities_ratio``: six months of observed debt service over month-end cash.

    Companies with no debt products and no repayments score 0 (nothing falls due).
    A company with service due and no cash gets the cap.
    """
    service = (
        tx.filter(
            pl.col("category").is_in(DEBT_SERVICE_CATEGORIES)
            & (pl.col("amount_eur") < 0)
        )
        .group_by("company_id", pl.col("date").dt.truncate("1mo").alias("month"))
        .agg((-pl.col("amount_eur")).sum().alias("debt_service"))
    )
    has_debt = (
        debt_products.filter(pl.col("type").is_in(DEBT_TYPES))
        .select("company_id")
        .unique()
        .with_columns(pl.lit(True).alias("has_debt"))
    )
    out = panel.join(service, on=["company_id", "month"], how="left").join(
        has_debt, on="company_id", how="left"
    )
    out = out.sort("company_id", "month").with_columns(
        rolling_sum("debt_service", 3).alias("service_3m")
    )
    projected = pl.col("service_3m") * 2.0
    ratio = (
        pl.when(projected <= 0)
        .then(0.0)
        .when(pl.col("cash_end").is_null())
        .then(None)
        .when(pl.col("cash_end") <= 0)
        .then(MAX_MATURITY_RATIO)
        .otherwise(
            pl.min_horizontal(projected / pl.col("cash_end"), MAX_MATURITY_RATIO)
        )
    )
    return out.with_columns(ratio.alias("maturities_ratio")).drop(
        "has_debt", "debt_service"
    )
