"""Detail behind #12 exposición a contrapartes: the customers and their payment health."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.details.common import (
    Blocks,
    DetailContext,
    Rows,
    month_rows,
    rounded,
    rows_by_company,
)
from ml_service.pulse.details.counterparties import billed_ranking, named_counterparties
from ml_service.pulse.features.months import month_index
from ml_service.pulse.features.network import MIN_COMPANIES, WINDOW, counterparty_health

CUSTOMER_FIELDS = [
    "counterparty_id",
    "billed_6m",
    "share",
    "health",
    "health_d3",
    "n_companies",
]


def _customers(ctx: DetailContext) -> Rows:
    """Customers that entered the variable at the reference month, largest first.

    Only customers with billing in the trailing half year and a known change in
    their payment health count, which is exactly the pairs ``network_exposure``
    averages, so ``share`` sums to one over the whole ranking.
    """
    ar = ctx.clean.invoices.filter(pl.col("side") == "ar")
    grid_months = ctx.scored.select(month_index("month").alias("_mi")).unique()
    health = counterparty_health(ar, grid_months).filter(
        pl.col("n_companies") >= MIN_COMPANIES
    )
    billed = (
        billed_ranking(named_counterparties(ctx.clean.invoices, "ar"), ctx, WINDOW)
        .filter(pl.col("billed") > 0)
        .join(ctx.ref.select("company_id", "ref_mi"), on="company_id")
    )
    df = (
        billed.join(
            health,
            left_on=["counterparty_id", "ref_mi"],
            right_on=["counterparty_id", "_mi"],
        )
        .filter(pl.col("health_d3").is_not_null())
        .with_columns(
            pl.col("billed").alias("billed_6m"),
            (pl.col("billed") / pl.col("billed").sum().over("company_id")).alias(
                "share"
            ),
        )
        .sort(["company_id", "billed_6m"], descending=[False, True])
    )
    return rows_by_company(rounded(df), CUSTOMER_FIELDS)


def blocks(ctx: DetailContext) -> dict[str, Blocks]:
    """Build the ``network`` block for every company."""
    customers = _customers(ctx)
    months = month_rows(
        ctx.scored,
        {"exposure": "network_exposure", "customers": "network_customers"},
    )
    return {
        "network": {
            cid: {
                "customers": customers.get(cid, []),
                "months": months.get(cid, []),
            }
            for cid in ctx.companies
        }
    }
