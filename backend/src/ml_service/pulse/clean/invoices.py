"""Clean ERP invoices: document types, currency, outliers and the seeded date corruption."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.clean.currency import convert
from ml_service.pulse.clean.report import CleaningReport
from ml_service.pulse.config import (
    CLEAN,
    EXTRACTION_DATE,
    INVOICE_DOC_TYPES,
    CleaningThresholds,
)
from ml_service.pulse.load import RawData


def _drop_unusable(inv: pl.DataFrame, report: CleaningReport) -> pl.DataFrame:
    n = len(inv)
    not_invoice = ~pl.col("document_type").is_in(INVOICE_DOC_TYPES)
    cancelled = pl.col("status") == "cancel"
    zero = pl.col("amount").is_null() | (pl.col("amount") == 0)
    no_issue = pl.col("issuance_date").is_null() | (
        pl.col("issuance_date") > EXTRACTION_DATE
    )
    report.add(
        "invoices",
        "document_type not invoice/invoiceGroup",
        inv.filter(not_invoice).height,
        n,
    )
    report.add(
        "invoices", "status cancel", inv.filter(cancelled & ~not_invoice).height, n
    )
    report.add(
        "invoices",
        "amount null or zero",
        inv.filter(zero & ~not_invoice & ~cancelled).height,
        n,
    )
    report.add(
        "invoices",
        "issuance_date null or after extraction",
        inv.filter(no_issue).height,
        n,
    )
    return inv.filter(~not_invoice & ~cancelled & ~zero & ~no_issue)


def _validate_dates(
    inv: pl.DataFrame, report: CleaningReport, th: CleaningThresholds
) -> pl.DataFrame:
    """Keep due/payment dates only when they are physically possible; otherwise null them."""
    n = len(inv)
    terms = (pl.col("due_date") - pl.col("issuance_date")).dt.total_days()
    due_ok = (
        pl.col("due_date").is_not_null() & (terms >= 0) & (terms <= th.max_terms_days)
    )
    report.add(
        "invoices",
        f"due_date impossible (before issuance or > {th.max_terms_days} d) -> unknown",
        inv.filter(~due_ok).height,
        n,
    )
    settled = (pl.col("status") == "paid") & (
        pl.col("pending_amount").abs() <= pl.col("amount").abs() * 0.01
    )
    pay_days = (pl.col("payment_date") - pl.col("issuance_date")).dt.total_days()
    pay_ok = (
        settled
        & pl.col("payment_date").is_not_null()
        & (pay_days >= 0)
        & (pay_days <= th.max_pay_days)
        & (pl.col("payment_date") <= EXTRACTION_DATE + pl.duration(days=1))
    )
    report.add(
        "invoices",
        "payment_date not trusted (status != paid or pending > 0)",
        inv.filter(~settled).height,
        n,
        note="unpaid documents carry the due date as payment_date",
    )
    report.add(
        "invoices",
        "payment_date impossible on settled invoices -> unknown",
        inv.filter(settled & ~pay_ok).height,
        n,
    )
    return inv.with_columns(
        pl.when(due_ok).then(pl.col("due_date")).otherwise(None).alias("due_date"),
        pl.when(pay_ok)
        .then(pl.col("payment_date"))
        .otherwise(None)
        .alias("payment_date"),
        settled.alias("settled"),
    )


def _drop_outliers(
    inv: pl.DataFrame, report: CleaningReport, th: CleaningThresholds
) -> pl.DataFrame:
    n = len(inv)
    p99 = inv.group_by("company_id").agg(
        pl.col("amount_eur").abs().quantile(0.99).alias("_p99")
    )
    out = inv.join(p99, on="company_id", how="left")
    bad = (pl.col("amount_eur").abs() > th.inv_outlier_mult * pl.col("_p99")) & (
        pl.col("amount_eur").abs() > th.inv_outlier_min
    )
    report.add(
        "invoices",
        f"|amount| > {th.inv_outlier_mult:.0f}x company p99 and > {th.inv_outlier_min:.0e} EUR",
        out.filter(bad).height,
        n,
        note=f"sum {out.filter(bad)['amount_eur'].abs().sum():.3e} EUR",
    )
    return out.filter(~bad).drop("_p99")


def clean_invoices(
    raw: RawData, report: CleaningReport, th: CleaningThresholds = CLEAN
) -> pl.DataFrame:
    """Return real invoices in EUR with ``side`` (ar/ap), validated dates and absolute amounts."""
    inv = _drop_unusable(raw.invoices, report)
    inv = inv.with_columns(
        pl.col("currency").fill_null(pl.col("accounting_currency")).fill_null("EUR")
    )
    inv = convert(inv, "currency", ("amount", "pending_amount"), "invoices", report)
    inv = _validate_dates(inv, report, th)
    inv = _drop_outliers(inv, report, th)
    pending = pl.min_horizontal(
        pl.col("pending_amount_eur").abs(), pl.col("amount_eur").abs()
    )
    return inv.select(
        "operation_id",
        "company_id",
        "counterparty_id",
        "issuance_date",
        "due_date",
        "payment_date",
        "settled",
        "status",
        side=pl.when(pl.col("amount") > 0).then(pl.lit("ar")).otherwise(pl.lit("ap")),
        amount_eur=pl.col("amount_eur").abs(),
        pending_eur=pl.when(pl.col("settled"))
        .then(0.0)
        .otherwise(pending.fill_null(pl.col("amount_eur").abs())),
    ).sort("company_id", "issuance_date")
