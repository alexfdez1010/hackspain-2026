"""Detail behind #8 tramo +90 días: the aging of the open portfolio and its debtors."""

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
from ml_service.pulse.features.receivables import open_receivables_by_month

BUCKETS = ("al_dia", "1_30", "31_60", "61_90", "mas_90")
"""Aging buckets by days past due at the month end, always published in this order."""
OVER_90 = 90
DEBTOR_FIELDS = ["counterparty_id", "open", "over_90", "share_over_90"]


def _bucket() -> pl.Expr:
    """Name of the aging bucket a receivable falls in, from its days past due."""
    days = pl.col("days_past_due")
    return (
        pl.when(days <= 0)
        .then(pl.lit(BUCKETS[0]))
        .when(days <= 30)
        .then(pl.lit(BUCKETS[1]))
        .when(days <= 60)
        .then(pl.lit(BUCKETS[2]))
        .when(days <= OVER_90)
        .then(pl.lit(BUCKETS[3]))
        .otherwise(pl.lit(BUCKETS[4]))
    )


def open_receivables(ctx: DetailContext) -> pl.DataFrame:
    """Every receivable still open at each month end, with its days past due.

    The month end is the first day of the following month, exactly as the
    ``ar90_share`` feature measures it.
    """
    ar = ctx.clean.invoices.filter(
        (pl.col("side") == "ar") & pl.col("due_date").is_not_null()
    )
    opened = open_receivables_by_month(ar)
    month_end = pl.col("month").dt.offset_by("1mo")
    return opened.with_columns(
        (month_end - pl.col("due_date")).dt.total_days().alias("days_past_due")
    )


def _aging(ctx: DetailContext, at_ref: pl.DataFrame) -> Rows:
    """The five buckets for every company, zero-filled when nothing is open."""
    order = pl.DataFrame({"bucket": list(BUCKETS), "_order": list(range(len(BUCKETS)))})
    grid = pl.DataFrame({"company_id": list(ctx.companies)}).join(order, how="cross")
    counts = (
        at_ref.with_columns(_bucket().alias("bucket"))
        .group_by("company_id", "bucket")
        .agg(pl.col("amount_eur").sum().alias("amount"), pl.len().alias("invoices"))
    )
    df = (
        grid.join(counts, on=["company_id", "bucket"], how="left")
        .with_columns(pl.col("amount").fill_null(0.0), pl.col("invoices").fill_null(0))
        .sort("company_id", "_order")
    )
    return rows_by_company(rounded(df), ["bucket", "amount", "invoices"], limit=None)


def _debtors(at_ref: pl.DataFrame) -> Rows:
    """Debtors ranked by what they owe past 90 days, then by what they owe at all."""
    over_90 = pl.when(pl.col("days_past_due") > OVER_90).then(pl.col("amount_eur"))
    df = (
        at_ref.filter(pl.col("counterparty_id").is_not_null())
        .group_by("company_id", "counterparty_id")
        .agg(
            pl.col("amount_eur").sum().alias("open"),
            over_90.otherwise(0.0).sum().alias("over_90"),
        )
        .with_columns(
            pl.when(pl.col("open") > 0)
            .then(pl.col("over_90") / pl.col("open"))
            .otherwise(None)
            .alias("share_over_90")
        )
        .sort(
            ["company_id", "over_90", "open", "counterparty_id"],
            descending=[False, True, True, False],
        )
    )
    return rows_by_company(rounded(df), DEBTOR_FIELDS)


def _months(ctx: DetailContext, opened: pl.DataFrame) -> Rows:
    """Open portfolio, the part past 90 days and the published share, month by month."""
    monthly = opened.group_by("company_id", "month").agg(
        pl.col("amount_eur").sum().alias("open"),
        pl.when(pl.col("days_past_due") > OVER_90)
        .then(pl.col("amount_eur"))
        .otherwise(0.0)
        .sum()
        .alias("over_90"),
    )
    panel = ctx.scored.select("company_id", "month", "ar90_share").join(
        monthly, on=["company_id", "month"], how="left"
    )
    return month_rows(
        panel, {"open": "open", "over_90": "over_90", "share": "ar90_share"}
    )


def blocks(ctx: DetailContext) -> dict[str, Blocks]:
    """Build the ``ar90`` block for every company."""
    opened = open_receivables(ctx)
    at_ref = opened.join(ctx.ref, on="company_id").filter(
        pl.col("month") == pl.col("ref_month")
    )
    aging, debtors, months = _aging(ctx, at_ref), _debtors(at_ref), _months(ctx, opened)
    return {
        "ar90": {
            cid: {
                "aging": aging.get(cid, []),
                "debtors": debtors.get(cid, []),
                "months": months.get(cid, []),
            }
            for cid in ctx.companies
        }
    }
