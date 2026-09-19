"""Detail behind #5 DPO real and #6 plazo concedido: the suppliers behind each figure."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.details.common import (
    Blocks,
    DetailContext,
    Rows,
    in_window,
    month_rows,
    rounded,
    rows_by_company,
)
from ml_service.pulse.details.counterparties import (
    named_counterparties,
    settlement_ranking,
)
from ml_service.pulse.features.months import weighted_mean

TERMS_WINDOW = 6
"""Trailing months of issued supplier invoices behind the granted terms."""
DPO_FIELDS = [
    "counterparty_id",
    "paid_3m",
    "invoices",
    "dpo_days",
    "terms_days",
    "late_days",
]
TERMS_FIELDS = ["counterparty_id", "billed_6m", "invoices", "terms_days"]


def _suppliers_paid(ctx: DetailContext) -> Rows:
    """Suppliers ranked by what the company paid them in the trailing quarter."""
    df = settlement_ranking(ctx, "ap").rename({"amount": "paid_3m", "days": "dpo_days"})
    return rows_by_company(rounded(df), DPO_FIELDS)


def _suppliers_terms(ctx: DetailContext) -> Rows:
    """Suppliers ranked by what they invoiced over the trailing half year."""
    ap = named_counterparties(ctx.clean.invoices, "ap").filter(
        pl.col("due_date").is_not_null()
    )
    window = in_window(ap, ctx.ref, "issuance_date", TERMS_WINDOW).with_columns(
        (pl.col("due_date") - pl.col("issuance_date"))
        .dt.total_days()
        .cast(pl.Float64)
        .alias("_terms")
    )
    df = (
        window.group_by("company_id", "counterparty_id")
        .agg(
            pl.col("amount_eur").sum().alias("billed_6m"),
            pl.len().alias("invoices"),
            weighted_mean("_terms", "amount_eur").alias("terms_days"),
        )
        .sort(["company_id", "billed_6m"], descending=[False, True])
    )
    return rows_by_company(rounded(df), TERMS_FIELDS)


def blocks(ctx: DetailContext) -> dict[str, Blocks]:
    """Build the ``dpo`` and ``terms`` blocks for every company."""
    paid, terms = _suppliers_paid(ctx), _suppliers_terms(ctx)
    dpo_months = month_rows(ctx.scored, {"dpo_days": "dpo_days", "dpo_d3": "dpo_d3"})
    terms_months = month_rows(
        ctx.scored, {"terms_days": "terms_days", "terms_d6": "terms_d6"}
    )
    return {
        "dpo": {
            cid: {"suppliers": paid.get(cid, []), "months": dpo_months.get(cid, [])}
            for cid in ctx.companies
        },
        "terms": {
            cid: {"suppliers": terms.get(cid, []), "months": terms_months.get(cid, [])}
            for cid in ctx.companies
        },
    }
