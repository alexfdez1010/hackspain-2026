"""Counterparty rankings shared by the payables and receivables details."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.details.common import DetailContext, in_window
from ml_service.pulse.features.months import weighted_mean

SETTLEMENT_WINDOW = 3
"""Trailing months of settled invoices behind DPO and DSO."""


def named_counterparties(inv: pl.DataFrame, side: str) -> pl.DataFrame:
    """Invoices of one side of the ledger that carry a counterparty."""
    return inv.filter(
        (pl.col("side") == side) & pl.col("counterparty_id").is_not_null()
    )


def settlement_ranking(ctx: DetailContext, side: str) -> pl.DataFrame:
    """Per counterparty, how long the company took to settle the trailing quarter.

    ``days`` is the value-weighted gap between issuance and payment over the
    invoices paid in the last :data:`SETTLEMENT_WINDOW` months, ``terms_days``
    the value-weighted gap that had been granted on those same invoices and
    ``late_days`` the difference. Rows come out sorted by ``amount`` descending.
    """
    paid = named_counterparties(ctx.clean.invoices, side).filter(
        pl.col("payment_date").is_not_null()
    )
    window = in_window(paid, ctx.ref, "payment_date", SETTLEMENT_WINDOW).with_columns(
        (pl.col("payment_date") - pl.col("issuance_date"))
        .dt.total_days()
        .cast(pl.Float64)
        .alias("days"),
        (pl.col("due_date") - pl.col("issuance_date"))
        .dt.total_days()
        .cast(pl.Float64)
        .fill_null(0.0)
        .alias("_terms"),
        pl.when(pl.col("due_date").is_not_null())
        .then(pl.col("amount_eur"))
        .otherwise(0.0)
        .alias("_terms_weight"),
    )
    ranked = window.group_by("company_id", "counterparty_id").agg(
        pl.col("amount_eur").sum().alias("amount"),
        pl.len().alias("invoices"),
        weighted_mean("days", "amount_eur").alias("days"),
        weighted_mean("_terms", "_terms_weight").alias("terms_days"),
    )
    return ranked.with_columns(
        (pl.col("days") - pl.col("terms_days")).alias("late_days")
    ).sort(["company_id", "amount", "counterparty_id"], descending=[False, True, False])


def billed_ranking(
    inv: pl.DataFrame, ctx: DetailContext, months: int, offset: int = 0
) -> pl.DataFrame:
    """Per counterparty, the amount issued in a trailing window of ``months``."""
    return (
        in_window(inv, ctx.ref, "issuance_date", months, offset)
        .group_by("company_id", "counterparty_id")
        .agg(pl.col("amount_eur").sum().alias("billed"), pl.len().alias("invoices"))
    )
