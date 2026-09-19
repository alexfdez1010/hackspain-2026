"""Clean the balance snapshot: currency, cash-account selection, implausible anchors."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.clean.currency import convert, product_currency
from ml_service.pulse.clean.report import CleaningReport
from ml_service.pulse.config import CASH_TYPES, CLEAN, CleaningThresholds
from ml_service.pulse.load import RawData


def clean_cash_balances(
    raw: RawData,
    tx: pl.DataFrame,
    report: CleaningReport,
    th: CleaningThresholds = CLEAN,
) -> pl.DataFrame:
    """One row per cash product with ``balance_eur`` (null = no credible anchor).

    A snapshot is discarded when it is out of proportion with the company's own
    cleaned cash flow: |balance| above ``balance_mult`` x the average monthly
    gross flow and above ``balance_min`` EUR.
    """
    cash_products = raw.products.filter(pl.col("type").is_in(CASH_TYPES)).select(
        "product_id", "company_id"
    )
    bal = raw.balances.select("product_id", "balance").join(
        product_currency(raw.products, raw.companies), on="product_id", how="left"
    )
    bal = bal.with_columns(pl.col("currency").fill_null("EUR"))
    bal = convert(bal, "currency", ("balance",), "balances", report)
    out = cash_products.join(
        bal.select("product_id", "balance_eur"), on="product_id", how="left"
    )
    report.add(
        "balances",
        "cash products without a snapshot (unanchored)",
        out["balance_eur"].is_null().sum(),
        len(out),
    )
    months = tx.select(pl.col("date").dt.truncate("1mo").n_unique()).item() or 1
    flow = (
        tx.filter(pl.col("product_type").is_in(CASH_TYPES))
        .group_by("company_id")
        .agg((pl.col("amount_eur").abs().sum() / months).alias("_gross_month"))
    )
    out = out.join(flow, on="company_id", how="left").with_columns(
        pl.col("_gross_month").fill_null(0.0)
    )
    implausible = (
        pl.col("balance_eur").abs() > th.balance_mult * pl.col("_gross_month")
    ) & (pl.col("balance_eur").abs() > th.balance_min)
    report.add(
        "balances",
        f"|balance| > {th.balance_mult:.0f}x monthly gross flow and > {th.balance_min:.0e} EUR -> unanchored",
        out.filter(implausible).height,
        len(out),
        note=f"max discarded {out.filter(implausible)['balance_eur'].abs().max() or 0:.3e} EUR",
    )
    report.add(
        "balances",
        "cash snapshot exactly zero (kept, but weak anchor)",
        out.filter(pl.col("balance_eur") == 0).height,
        len(out),
    )
    return out.with_columns(
        pl.when(implausible)
        .then(None)
        .otherwise(pl.col("balance_eur"))
        .alias("balance_eur")
    ).drop("_gross_month")
