"""Detail behind #1 días de caja and #2 mínimo intramensual: daily balances and accounts."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.details.common import (
    DAYS_SHOWN,
    Blocks,
    DetailContext,
    Rows,
    Values,
    at_reference,
    month_rows,
    rounded,
    rows_by_company,
    values_by_company,
)
from ml_service.pulse.features.cash import _daily_balances

DAYS_PER_QUARTER = 90.0


def _company_daily(daily: pl.DataFrame, ref: pl.DataFrame) -> pl.DataFrame:
    """Close-of-day cash of the whole company, up to its reference month end."""
    return (
        daily.group_by("company_id", "day")
        .agg(pl.col("balance").sum().alias("balance"))
        .join(ref, on="company_id")
        .filter(pl.col("day") <= pl.col("ref_day"))
    )


def _series(company_daily: pl.DataFrame) -> Rows:
    """Last :data:`DAYS_SHOWN` days of company cash, ascending."""
    window = company_daily.filter(
        pl.col("day") > pl.col("ref_day").dt.offset_by(f"-{DAYS_SHOWN}d")
    ).sort("company_id", "day")
    df = window.select("company_id", pl.col("day").dt.strftime("%Y-%m-%d"), "balance")
    return rows_by_company(rounded(df), ["day", "balance"], limit=None)


def _min_day(company_daily: pl.DataFrame) -> dict[str, dict | None]:
    """Lowest day of the reference month per company (earliest day on a tie)."""
    month = company_daily.filter(pl.col("day") >= pl.col("ref_month").dt.date())
    low = (
        month.sort("company_id", "balance", "day")
        .group_by("company_id", maintain_order=True)
        .first()
        .select("company_id", pl.col("day").dt.strftime("%Y-%m-%d"), "balance")
    )
    rows = rows_by_company(rounded(low), ["day", "balance"], limit=1)
    return {cid: r[0] for cid, r in rows.items()}


def _accounts(daily: pl.DataFrame, ctx: DetailContext) -> Rows:
    """Every cash account with its balance at the reference month end, richest first."""
    at_end = daily.join(ctx.ref, on="company_id").filter(
        pl.col("day") == pl.col("ref_day")
    )
    df = (
        at_end.join(ctx.products, on="product_id", how="left")
        .select("company_id", "product_id", "label", "bank", "type", "balance")
        .sort(["company_id", "balance", "product_id"], descending=[False, True, False])
    )
    return rows_by_company(
        rounded(df), ["product_id", "label", "bank", "type", "balance"]
    )


def _daily_outflow(ctx: DetailContext) -> Values:
    """Average daily operating outflow of the reference month (``outflow_3m`` / 90)."""
    df = at_reference(ctx.scored.select("company_id", "month", "outflow_3m"), ctx.ref)
    return values_by_company(
        rounded(df.with_columns((pl.col("outflow_3m") / DAYS_PER_QUARTER).alias("v"))),
        "v",
    )


def blocks(ctx: DetailContext) -> dict[str, Blocks]:
    """Build the ``cash_days`` and ``cash_min`` blocks for every company."""
    daily = _daily_balances(ctx.clean.transactions, ctx.clean.cash_balances)
    company_daily = _company_daily(daily, ctx.ref)
    series, min_day = _series(company_daily), _min_day(company_daily)
    accounts, outflow = _accounts(daily, ctx), _daily_outflow(ctx)
    days_months = month_rows(
        ctx.scored,
        {"cash_end": "cash_end", "outflow_3m": "outflow_3m", "cash_days": "cash_days"},
    )
    min_months = month_rows(
        ctx.scored,
        {
            "cash_end": "cash_end",
            "cash_min": "cash_min",
            "outflow": "outflow",
            "ratio": "cash_min_ratio",
        },
    )
    return {
        "cash_days": {
            cid: {
                "daily": series.get(cid, []),
                "daily_outflow": outflow.get(cid),
                "accounts": accounts.get(cid, []),
                "months": days_months.get(cid, []),
            }
            for cid in ctx.companies
        },
        "cash_min": {
            cid: {
                "daily": series.get(cid, []),
                "months": min_months.get(cid, []),
                "min_day": min_day.get(cid),
            }
            for cid in ctx.companies
        },
    }
