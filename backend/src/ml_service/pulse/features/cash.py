"""Pillar liquidez: #1 días de caja, #2 mínimo intramensual (daily balances rebuilt backwards)."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.config import (
    CASH_TYPES,
    EXTRACTION_DATE,
    FIRST_MONTH,
    INTERCOMPANY_REGEX,
)
from ml_service.pulse.features.months import rolling_sum

MAX_CASH_DAYS = 365.0
MAX_MIN_RATIO = (
    12.0  # months of outflow covered by the lowest balance, clipped both ways
)


def _daily_balances(tx: pl.DataFrame, anchors: pl.DataFrame) -> pl.DataFrame:
    """Close-of-day balance per cash product, walking back from the snapshot.

    Products without a credible anchor are shifted so their lowest day is zero
    (conservative: they can never show an overdraft, only a thin cushion).
    """
    daily = (
        tx.filter(pl.col("product_type").is_in(CASH_TYPES))
        .group_by("company_id", "product_id", pl.col("date").dt.date().alias("day"))
        .agg(pl.col("amount_eur").sum().alias("net"))
    )
    days = pl.date_range(
        FIRST_MONTH.date(), EXTRACTION_DATE.date(), "1d", eager=True
    ).alias("day")
    grid = (
        daily.select("company_id", "product_id")
        .unique()
        .join(pl.DataFrame({"day": days}), how="cross")
    )
    daily = (
        grid.join(daily, on=["company_id", "product_id", "day"], how="left")
        .with_columns(pl.col("net").fill_null(0.0))
        .sort("product_id", "day", descending=[False, True])
    )
    # balance(d) = anchor - sum of net flows strictly after d
    after = pl.col("net").cum_sum().over("product_id") - pl.col("net")
    daily = daily.join(
        anchors.select("product_id", "balance_eur"), on="product_id", how="left"
    )
    daily = daily.with_columns(
        (pl.col("balance_eur").fill_null(0.0) - after).alias("balance")
    )
    floor = (
        pl.when(pl.col("balance_eur").is_null())
        .then(pl.min_horizontal(pl.col("balance").min().over("product_id"), 0.0))
        .otherwise(0.0)
    )
    return daily.with_columns((pl.col("balance") - floor).alias("balance")).select(
        "company_id", "product_id", "day", "balance"
    )


def _operating_outflows(tx: pl.DataFrame) -> pl.DataFrame:
    """Monthly gross outflows on cash accounts, excluding internal/intragroup moves."""
    cash = tx.filter(pl.col("product_type").is_in(CASH_TYPES))
    inflows = (
        cash.filter(pl.col("amount_eur") > 0)
        .select(
            "company_id",
            pl.col("date").dt.date().alias("_d"),
            (-pl.col("amount_eur")).alias("amount_eur"),
        )
        .unique()
    )
    out = cash.filter(pl.col("amount_eur") < 0).with_columns(
        pl.col("date").dt.date().alias("_d")
    )
    out = out.join(
        inflows.with_columns(pl.lit(True).alias("_mirrored")),
        on=["company_id", "_d", "amount_eur"],
        how="left",
    )
    internal = pl.col("_mirrored").fill_null(False) | pl.col(
        "description"
    ).str.contains(INTERCOMPANY_REGEX).fill_null(False)
    return (
        out.filter(~internal)
        .group_by("company_id", pl.col("date").dt.truncate("1mo").alias("month"))
        .agg((-pl.col("amount_eur")).sum().alias("outflow"))
    )


def cash_features(
    tx: pl.DataFrame, anchors: pl.DataFrame, grid: pl.DataFrame
) -> pl.DataFrame:
    """Add ``cash_end``, ``cash_min``, ``outflow_3m``, ``cash_days``, ``cash_min_ratio`` to the grid."""
    daily = _daily_balances(tx, anchors)
    company_daily = daily.group_by("company_id", "day").agg(
        pl.col("balance").sum().alias("balance")
    )
    monthly = (
        company_daily.filter(pl.col("day") < EXTRACTION_DATE.date())
        .sort("company_id", "day")
        .group_by(
            "company_id",
            pl.col("day").dt.truncate("1mo").cast(pl.Datetime("us")).alias("month"),
        )
        .agg(
            pl.col("balance").last().alias("cash_end"),
            pl.col("balance").min().alias("cash_min"),
        )
    )
    panel = (
        grid.join(monthly, on=["company_id", "month"], how="left")
        .join(_operating_outflows(tx), on=["company_id", "month"], how="left")
        .sort("company_id", "month")
    )
    panel = panel.with_columns(rolling_sum("outflow", 3).alias("outflow_3m"))
    daily_burn = pl.col("outflow_3m") / 90.0
    monthly_burn = pl.col("outflow_3m") / 3.0
    return panel.with_columns(
        pl.when(pl.col("cash_end").is_null())
        .then(None)
        .when(pl.col("cash_end") <= 0)
        .then(0.0)
        .when(daily_burn <= 0)
        .then(MAX_CASH_DAYS)
        .otherwise(pl.min_horizontal(pl.col("cash_end") / daily_burn, MAX_CASH_DAYS))
        .alias("cash_days"),
        pl.when(pl.col("cash_min").is_null() | (monthly_burn <= 0))
        .then(None)
        .otherwise(pl.col("cash_min") / monthly_burn)
        .clip(-MAX_MIN_RATIO, MAX_MIN_RATIO)
        .alias("cash_min_ratio"),
    )
