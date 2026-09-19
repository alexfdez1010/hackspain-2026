"""Detail behind #7 DSO real and #9 caída del cliente top: the customers behind each figure."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.details.common import (
    Blocks,
    DetailContext,
    Rows,
    at_reference,
    month_rows,
    rounded,
    rows_by_company,
)
from ml_service.pulse.details.counterparties import (
    billed_ranking,
    named_counterparties,
    settlement_ranking,
)
from ml_service.pulse.features.receivables import GROWTH_CLIP, TOP_WINDOW

GROWTH_WINDOW = 3
"""Trailing months compared against the previous three for the top customer."""
DSO_FIELDS = [
    "counterparty_id",
    "collected_3m",
    "invoices",
    "dso_days",
    "terms_days",
    "late_days",
]
TOP_FIELDS = [
    "counterparty_id",
    "billed_3m",
    "billed_prev_3m",
    "growth",
    "share_12m",
    "top",
]


def _customers_collected(ctx: DetailContext) -> Rows:
    """Customers ranked by what they settled in the trailing quarter."""
    df = settlement_ranking(ctx, "ar").rename(
        {"amount": "collected_3m", "days": "dso_days"}
    )
    return rows_by_company(rounded(df), DSO_FIELDS)


def _growth() -> pl.Expr:
    """Change of the trailing quarter against the previous one, clipped like the feature."""
    prev = pl.col("billed_prev_3m")
    return (
        pl.when(prev.is_null() | (prev <= 0))
        .then(None)
        .otherwise(
            ((pl.col("billed_3m") - prev) / prev).clip(-GROWTH_CLIP, GROWTH_CLIP)
        )
    )


def _customers_billed(ctx: DetailContext) -> Rows:
    """Customers ranked by their yearly billing, flagging the one variable #9 tracks."""
    ar = named_counterparties(ctx.clean.invoices, "ar")
    keys = ["company_id", "counterparty_id"]
    recent = billed_ranking(ar, ctx, GROWTH_WINDOW).select(
        *keys, billed_3m=pl.col("billed")
    )
    previous = billed_ranking(ar, ctx, GROWTH_WINDOW, offset=GROWTH_WINDOW).select(
        *keys, billed_prev_3m=pl.col("billed")
    )
    chosen = at_reference(
        ctx.scored.select("company_id", "month", "top_client_id"), ctx.ref
    ).select("company_id", "top_client_id")
    df = (
        billed_ranking(ar, ctx, TOP_WINDOW)
        .join(recent, on=keys, how="left")
        .join(previous, on=keys, how="left")
        .join(chosen, on="company_id", how="left")
        .with_columns(
            pl.col("billed_3m").fill_null(0.0),
            pl.col("billed_prev_3m").fill_null(0.0),
        )
        .with_columns(
            _growth().alias("growth"),
            (pl.col("billed") / pl.col("billed").sum().over("company_id")).alias(
                "share_12m"
            ),
            (pl.col("counterparty_id") == pl.col("top_client_id"))
            .fill_null(False)
            .alias("top"),
        )
        .sort(
            ["company_id", "billed", "counterparty_id"], descending=[False, True, False]
        )
    )
    return rows_by_company(rounded(df), TOP_FIELDS)


def blocks(ctx: DetailContext) -> dict[str, Blocks]:
    """Build the ``dso`` and ``top_client`` blocks for every company."""
    collected, billed = _customers_collected(ctx), _customers_billed(ctx)
    dso_months = month_rows(ctx.scored, {"dso_days": "dso_days"})
    top_months = month_rows(
        ctx.scored,
        {"top_counterparty_id": "top_client_id", "growth": "top_client_growth"},
    )
    return {
        "dso": {
            cid: {
                "customers": collected.get(cid, []),
                "months": dso_months.get(cid, []),
            }
            for cid in ctx.companies
        },
        "top_client": {
            cid: {"customers": billed.get(cid, []), "months": top_months.get(cid, [])}
            for cid in ctx.companies
        },
    }
