"""#12 Exposición a contrapartes: how the company's customers are paying the whole network."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.features.months import (
    delta,
    month_from_index,
    month_index,
    rolling_sum,
)
from ml_service.pulse.features.receivables import open_receivables_by_month

WINDOW = 6
MIN_COMPANIES = 1  # in the hackathon dataset customer IDs never repeat across companies (see README)


def counterparty_health(ar: pl.DataFrame, grid_months: pl.DataFrame) -> pl.DataFrame:
    """Per (counterparty, month): 1 - value share of its invoices (trailing 6m) that are late.

    Late = settled after due date, or still open past due at that month end.
    Uses every company's receivables, so it is a view no single lender has.
    """
    ar = ar.filter(
        pl.col("counterparty_id").is_not_null() & pl.col("due_date").is_not_null()
    )
    settled = ar.filter(pl.col("payment_date").is_not_null()).with_columns(
        month_index("payment_date").alias("_mi"),
        (pl.col("payment_date") > pl.col("due_date")).alias("late"),
    )
    by_month = settled.group_by("counterparty_id", "_mi").agg(
        pl.col("amount_eur").sum().alias("settled_amt"),
        pl.when(pl.col("late"))
        .then(pl.col("amount_eur"))
        .otherwise(0.0)
        .sum()
        .alias("late_amt"),
    )
    opened = open_receivables_by_month(ar.filter(pl.col("payment_date").is_null()))
    past_due = (
        pl.col("month").dt.offset_by("1mo") - pl.col("due_date")
    ).dt.total_days() > 0
    open_by_month = (
        opened.with_columns(month_index("month").alias("_mi"))
        .group_by("counterparty_id", "_mi")
        .agg(
            pl.col("amount_eur").sum().alias("open_amt"),
            pl.when(past_due)
            .then(pl.col("amount_eur"))
            .otherwise(0.0)
            .sum()
            .alias("open_late_amt"),
        )
    )
    n_companies = ar.group_by("counterparty_id").agg(
        pl.col("company_id").n_unique().alias("n_companies")
    )
    keys = pl.concat(
        [
            by_month.select("counterparty_id", "_mi"),
            open_by_month.select("counterparty_id", "_mi"),
        ]
    ).unique()
    dense = (
        keys.select("counterparty_id")
        .unique()
        .join(grid_months, how="cross")
        .join(by_month, on=["counterparty_id", "_mi"], how="left")
        .join(open_by_month, on=["counterparty_id", "_mi"], how="left")
        .sort("counterparty_id", "_mi")
        .with_columns(
            rolling_sum("settled_amt", WINDOW, by="counterparty_id").alias("s"),
            rolling_sum("late_amt", WINDOW, by="counterparty_id").alias("l"),
        )
    )
    total = pl.col("s") + pl.col("open_amt").fill_null(0.0)
    late = pl.col("l") + pl.col("open_late_amt").fill_null(0.0)
    health = pl.when(total > 0).then(1 - late / total).otherwise(None)
    return (
        dense.with_columns(health.alias("health"))
        .with_columns(delta("health", 3, by="counterparty_id").alias("health_d3"))
        .join(n_companies, on="counterparty_id")
        .select("counterparty_id", "_mi", "health", "health_d3", "n_companies")
    )


def network_features(inv: pl.DataFrame, grid: pl.DataFrame) -> pl.DataFrame:
    """Add ``network_exposure``: sum over customers of (share of 6m billing) x (3m change in that customer's health)."""
    ar = inv.filter(pl.col("side") == "ar")
    grid_months = grid.select(month_index("month").alias("_mi")).unique()
    health = counterparty_health(ar, grid_months).filter(
        pl.col("n_companies") >= MIN_COMPANIES
    )
    billed = (
        ar.filter(pl.col("counterparty_id").is_not_null())
        .group_by(
            "company_id", "counterparty_id", month_index("issuance_date").alias("_mi")
        )
        .agg(pl.col("amount_eur").sum().alias("billed"))
    )
    pairs = (
        grid.select("company_id", month_index("month").alias("_mi"))
        .join(billed.select("company_id", "counterparty_id").unique(), on="company_id")
        .join(billed, on=["company_id", "counterparty_id", "_mi"], how="left")
        .sort("company_id", "counterparty_id", "_mi")
        .with_columns(
            rolling_sum("billed", WINDOW, by=("company_id", "counterparty_id")).alias(
                "b6"
            )
        )
        .filter(pl.col("b6") > 0)
        .join(health, on=["counterparty_id", "_mi"], how="inner")
        .filter(pl.col("health_d3").is_not_null())
    )
    exposure = (
        pairs.group_by("company_id", "_mi")
        .agg(
            ((pl.col("b6") * pl.col("health_d3")).sum() / pl.col("b6").sum()).alias(
                "network_exposure"
            ),
            pl.col("counterparty_id").n_unique().alias("network_customers"),
        )
        .with_columns(month_from_index("_mi").alias("month"))
        .drop("_mi")
    )
    return grid.join(exposure, on=["company_id", "month"], how="left")
