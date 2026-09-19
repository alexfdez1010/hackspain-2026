"""Clean bank transactions: duplicates, status, dates, currency, outliers."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.clean.currency import convert, product_currency
from ml_service.pulse.clean.report import CleaningReport
from ml_service.pulse.config import (
    CLEAN,
    COUNTERPARTY_TOKEN_REGEX,
    EXTRACTION_DATE,
    FIRST_MONTH,
    CleaningThresholds,
)
from ml_service.pulse.load import RawData

DUP_KEYS = ("company_id", "product_id", "date", "amount", "description")


def _drop_duplicates(tx: pl.DataFrame, report: CleaningReport) -> pl.DataFrame:
    n = len(tx)
    out = tx.unique(subset=list(DUP_KEYS), keep="first", maintain_order=True)
    report.add(
        "transactions",
        "exact duplicate (product, date, amount, description)",
        n - len(out),
        n,
    )
    return out


def _drop_unusable(tx: pl.DataFrame, report: CleaningReport) -> pl.DataFrame:
    n = len(tx)
    pending = (pl.col("status") == "pending").fill_null(False)
    report.add(
        "transactions", "status pending (not settled)", tx.filter(pending).height, n
    )
    bad_date = (
        pl.col("date").is_null()
        | (pl.col("date") < FIRST_MONTH)
        | (pl.col("date") >= EXTRACTION_DATE + pl.duration(days=1))
    )
    report.add(
        "transactions",
        "booking date null or outside dataset window",
        tx.filter(bad_date).height,
        n,
    )
    zero = pl.col("amount").is_null() | (pl.col("amount") == 0)
    report.add("transactions", "amount null or zero", tx.filter(zero).height, n)
    return tx.filter(~pending & ~bad_date & ~zero)


def _value_date(
    tx: pl.DataFrame, report: CleaningReport, th: CleaningThresholds
) -> pl.DataFrame:
    gap = (pl.col("value_date") - pl.col("date")).dt.total_days().abs()
    corrupt = pl.col("value_date").is_null() | (gap > th.max_value_date_gap)
    report.add(
        "transactions",
        "value_date corrupt (null or > 30 days from booking) -> booking date used",
        tx.filter(corrupt).height,
        len(tx),
    )
    return tx.with_columns(
        pl.when(corrupt)
        .then(pl.col("date"))
        .otherwise(pl.col("value_date"))
        .alias("value_date")
    )


def _drop_outliers(
    tx: pl.DataFrame, report: CleaningReport, th: CleaningThresholds
) -> pl.DataFrame:
    n = len(tx)
    p99 = tx.group_by("company_id").agg(
        pl.col("amount_eur").abs().quantile(0.99).alias("_p99")
    )
    out = tx.join(p99, on="company_id", how="left")
    absurd = pl.col("amount_eur").abs() > th.tx_abs_cap
    relative = (pl.col("amount_eur").abs() > th.tx_outlier_mult * pl.col("_p99")) & (
        pl.col("amount_eur").abs() > th.tx_outlier_min
    )
    report.add(
        "transactions",
        f"|amount| > {th.tx_abs_cap:.0e} EUR (absurd)",
        out.filter(absurd).height,
        n,
    )
    report.add(
        "transactions",
        f"|amount| > {th.tx_outlier_mult:.0f}x company p99 and > {th.tx_outlier_min:.0e} EUR",
        out.filter(relative & ~absurd).height,
        n,
        note=f"{out.filter(relative | absurd)['company_id'].n_unique()} companies affected",
    )
    return out.filter(~absurd & ~relative).drop("_p99")


def _resolve_counterparty(tx: pl.DataFrame, report: CleaningReport) -> pl.DataFrame:
    """Add ``counterparty_ref``: the column when filled, else the COUNTERPARTY_xxxxx token in the narrative."""
    token = pl.col("description").str.extract(COUNTERPARTY_TOKEN_REGEX, 1)
    out = tx.with_columns(
        pl.coalesce(pl.col("counterparty_id"), token).alias("counterparty_ref")
    )
    from_token = (
        pl.col("counterparty_id").is_null() & pl.col("counterparty_ref").is_not_null()
    )
    report.add(
        "transactions",
        "counterparty resolved from narrative token (column empty)",
        out.filter(from_token).height,
        len(out),
        note=f"{out['counterparty_ref'].null_count() / len(out):.1%} still unresolved",
    )
    return out


def clean_transactions(
    raw: RawData, report: CleaningReport, th: CleaningThresholds = CLEAN
) -> pl.DataFrame:
    """Return settled, deduplicated, EUR-denominated transactions with product type attached."""
    tx = _drop_duplicates(raw.transactions, report)
    tx = _drop_unusable(tx, report)
    tx = _value_date(tx, report, th)
    tx = tx.join(
        product_currency(raw.products, raw.companies), on="product_id", how="left"
    )
    tx = tx.join(
        raw.products.select("product_id", product_type=pl.col("type")),
        on="product_id",
        how="left",
    )
    report.add(
        "transactions",
        "product not in any product table (currency from company)",
        tx.filter(pl.col("currency").is_null()).height,
        len(tx),
    )
    tx = tx.join(
        raw.companies.select("company_id", _ccur=pl.col("currency")),
        on="company_id",
        how="left",
    )
    tx = tx.with_columns(
        pl.coalesce(pl.col("currency"), pl.col("_ccur"), pl.lit("EUR")).alias(
            "currency"
        )
    ).drop("_ccur")
    tx = convert(tx, "currency", ("amount",), "transactions", report)
    tx = _drop_outliers(tx, report, th)
    tx = _resolve_counterparty(tx, report)
    return tx.select(
        "transaction_id",
        "company_id",
        "product_id",
        "product_type",
        "date",
        "amount_eur",
        "category",
        "description",
        "counterparty_id",
        "counterparty_ref",
    ).sort("company_id", "product_id", "date")
