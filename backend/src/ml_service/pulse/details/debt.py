"""Detail behind #3 utilización, #4 aceleración and #10 vencimientos: lines and debt products."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.config import DEBT_SERVICE_CATEGORIES, DEBT_TYPES
from ml_service.pulse.details.common import (
    Blocks,
    DetailContext,
    Rows,
    month_rows,
    rounded,
    rows_by_company,
)
from ml_service.pulse.features.credit import _line_limits, _monthly_drawn

LINE_FIELDS = ["product_id", "label", "bank", "type", "limit", "drawn", "util"]
PRODUCT_FIELDS = [
    "product_id",
    "label",
    "type",
    "bank",
    "outstanding",
    "next_payment_date",
    "periods_left",
]


def _drawn_at_reference(drawn: pl.DataFrame, ref: pl.DataFrame) -> pl.DataFrame:
    """Drawn amount of each line at the last month at or before the reference month."""
    return (
        drawn.join(ref, on="company_id")
        .filter(pl.col("month") <= pl.col("ref_month"))
        .sort("month")
        .group_by("product_id", maintain_order=True)
        .last()
        .select("product_id", drawn_ref=pl.col("drawn"))
    )


def _lines(ctx: DetailContext, lines: pl.DataFrame, drawn: pl.DataFrame) -> Rows:
    """Every credit line with its limit, what is drawn and the resulting utilisation."""
    df = (
        lines.join(_drawn_at_reference(drawn, ctx.ref), on="product_id", how="left")
        .with_columns(pl.coalesce("drawn_ref", "drawn_now").alias("drawn"))
        .join(ctx.products, on="product_id", how="left")
        .select(
            "company_id",
            "product_id",
            "label",
            "bank",
            "type",
            "limit",
            "drawn",
            util=pl.when(pl.col("limit") > 0)
            .then(pl.col("drawn") / pl.col("limit"))
            .otherwise(None),
        )
        .sort(["company_id", "util"], descending=[False, True], nulls_last=True)
    )
    return rows_by_company(rounded(df), LINE_FIELDS)


def _line_months(ctx: DetailContext, lines: pl.DataFrame, drawn: pl.DataFrame) -> Rows:
    """Company drawn amount, total limit and the published utilisation, month by month."""
    limits = lines.group_by("company_id").agg(pl.col("limit").sum().alias("limit"))
    monthly = drawn.group_by("company_id", "month").agg(
        pl.col("drawn").sum().alias("drawn")
    )
    panel = (
        ctx.scored.select("company_id", "month", "loc_util")
        .join(limits, on="company_id", how="left")
        .join(monthly, on=["company_id", "month"], how="left")
        .sort("company_id", "month")
        .with_columns(pl.col("drawn").fill_null(strategy="forward").over("company_id"))
    )
    return month_rows(panel, {"drawn": "drawn", "limit": "limit", "util": "loc_util"})


def _debt_products(ctx: DetailContext) -> Rows:
    """Every debt product with what is outstanding and, when configured, its schedule."""
    schedule = ctx.schedule.select(
        "product_id", "next_payment_date", periods_left=pl.col("total_periods")
    )
    df = (
        ctx.clean.debt_products.filter(pl.col("type").is_in(DEBT_TYPES))
        .join(schedule, on="product_id", how="left")
        .select(
            "company_id",
            "product_id",
            "label",
            "type",
            bank=pl.col("bank_name"),
            outstanding=pl.col("outstanding").abs(),
            next_payment_date=pl.col("next_payment_date").dt.strftime("%Y-%m-%d"),
            periods_left=pl.col("periods_left"),
        )
        .sort(["company_id", "outstanding"], descending=[False, True], nulls_last=True)
    )
    return rows_by_company(rounded(df), PRODUCT_FIELDS)


def _service_months(ctx: DetailContext) -> Rows:
    """Observed debt service, its trailing quarter, the cash it lands on and the ratio."""
    service = (
        ctx.clean.transactions.filter(
            pl.col("category").is_in(DEBT_SERVICE_CATEGORIES)
            & (pl.col("amount_eur") < 0)
        )
        .group_by("company_id", pl.col("date").dt.truncate("1mo").alias("month"))
        .agg((-pl.col("amount_eur")).sum().alias("debt_service"))
    )
    panel = ctx.scored.select(
        "company_id", "month", "service_3m", "cash_end", "maturities_ratio"
    ).join(service, on=["company_id", "month"], how="left")
    return month_rows(
        panel,
        {
            "debt_service": "debt_service",
            "service_3m": "service_3m",
            "cash_end": "cash_end",
            "ratio": "maturities_ratio",
        },
    )


def blocks(ctx: DetailContext) -> dict[str, Blocks]:
    """Build the ``loc_util``, ``loc_accel`` and ``maturities`` blocks for every company."""
    lines = _line_limits(ctx.clean.debt_products, ctx.clean.balances_snapshot)
    drawn = _monthly_drawn(ctx.clean.transactions, lines)
    rows, line_months = _lines(ctx, lines, drawn), _line_months(ctx, lines, drawn)
    accel_months = month_rows(
        ctx.scored,
        {"util": "loc_util", "util_d3": "loc_util_d3", "accel": "loc_accel"},
    )
    products, service_months = _debt_products(ctx), _service_months(ctx)
    return {
        "loc_util": {
            cid: {"lines": rows.get(cid, []), "months": line_months.get(cid, [])}
            for cid in ctx.companies
        },
        "loc_accel": {
            cid: {"months": accel_months.get(cid, [])} for cid in ctx.companies
        },
        "maturities": {
            cid: {
                "products": products.get(cid, []),
                "months": service_months.get(cid, []),
            }
            for cid in ctx.companies
        },
    }
