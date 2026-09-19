"""Aggregate the raw debt products and the cleaned invoices per company."""

from __future__ import annotations

import math
from datetime import timedelta

import polars as pl

from ml_service.pulse.config import CREDIT_LINE_TYPES, EXTRACTION_DATE
from ml_service.pulse.recommend.snapshot import (
    Holdings,
    InvoiceBook,
)

LOAN_TYPES = ("loan", "leasing", "mortgage")
OVERDUE_CUTOFF_DAYS = 90
RECENT_MONTHS = 3


def _num(x) -> float | None:
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return None
    return float(x)


def holdings_by_company(
    debt_products: pl.DataFrame, schedule: pl.DataFrame
) -> dict[str, Holdings]:
    """Aggregate the raw debt products of every company (amounts as reported, EUR assumed)."""
    rates = schedule.group_by("company_id").agg(
        pl.col("annual_interest_rate_or_spread").median().alias("rate")
    )
    agg = (
        debt_products.with_columns(
            pl.col("granted").abs().fill_null(0.0).alias("granted"),
            pl.col("outstanding").abs().fill_null(0.0).alias("outstanding"),
        )
        .group_by("company_id")
        .agg(
            pl.col("type").unique().alias("types"),
            pl.col("granted")
            .filter(pl.col("type").is_in(CREDIT_LINE_TYPES))
            .sum()
            .alias("line_limit"),
            pl.col("outstanding")
            .filter(pl.col("type").is_in(CREDIT_LINE_TYPES))
            .sum()
            .alias("line_drawn"),
            pl.col("outstanding")
            .filter(pl.col("type").is_in(LOAN_TYPES))
            .sum()
            .alias("loan_outstanding"),
            pl.col("type").is_in(LOAN_TYPES).sum().alias("n_loans"),
        )
        .join(rates, on="company_id", how="left")
    )
    return {
        r["company_id"]: Holdings(
            types=tuple(sorted(r["types"])),
            line_limit=float(r["line_limit"]),
            line_drawn=min(float(r["line_drawn"]), float(r["line_limit"]) or math.inf),
            loan_outstanding=float(r["loan_outstanding"]),
            n_loans=int(r["n_loans"]),
            current_rate=_num(r["rate"]),
        )
        for r in agg.to_dicts()
    }


def invoice_books(clean_invoices: pl.DataFrame) -> dict[str, InvoiceBook]:
    """Open AR/AP and recent billing per company from the cleaned invoices."""
    cutoff = EXTRACTION_DATE - timedelta(days=OVERDUE_CUTOFF_DAYS)
    recent = EXTRACTION_DATE - timedelta(days=30 * RECENT_MONTHS)
    is_open = ~pl.col("settled") & (pl.col("pending_eur") > 0)
    current = pl.col("due_date").is_null() | (pl.col("due_date") >= cutoff)
    ar, ap = pl.col("side") == "ar", pl.col("side") == "ap"
    agg = clean_invoices.group_by("company_id").agg(
        pl.col("pending_eur").filter(is_open & ar).sum().alias("open_ar"),
        pl.col("pending_eur").filter(is_open & ar & current).sum().alias("eligible_ar"),
        (pl.col("amount_eur").filter(ar & (pl.col("issuance_date") >= recent)).sum())
        .truediv(RECENT_MONTHS)
        .alias("ar_monthly"),
        pl.col("pending_eur").filter(is_open & ap).sum().alias("open_ap"),
        (pl.col("amount_eur").filter(ap & (pl.col("issuance_date") >= recent)).sum())
        .truediv(RECENT_MONTHS)
        .alias("ap_monthly"),
    )
    return {
        r["company_id"]: InvoiceBook(
            has_erp=True,
            **{
                k: float(r[k] or 0.0)
                for k in InvoiceBook.__dataclass_fields__
                if k != "has_erp"
            },
        )
        for r in agg.to_dicts()
    }
