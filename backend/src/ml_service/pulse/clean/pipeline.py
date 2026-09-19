"""Run every cleaning step and hand back the frames the features consume."""

from __future__ import annotations

from dataclasses import dataclass

import polars as pl

from ml_service.pulse.clean.balances import clean_cash_balances
from ml_service.pulse.clean.invoices import clean_invoices
from ml_service.pulse.clean.report import CleaningReport
from ml_service.pulse.clean.transactions import clean_transactions
from ml_service.pulse.load import RawData


@dataclass(frozen=True)
class CleanData:
    """Cleaned inputs: EUR amounts, validated dates, credible balance anchors."""

    companies: pl.DataFrame
    products: pl.DataFrame
    transactions: pl.DataFrame
    invoices: pl.DataFrame
    cash_balances: pl.DataFrame
    debt_products: pl.DataFrame
    balances_snapshot: pl.DataFrame
    report: CleaningReport


def clean_all(raw: RawData) -> CleanData:
    """Apply the cleaning rules in dependency order (balances need cleaned flows)."""
    report = CleaningReport()
    tx = clean_transactions(raw, report)
    inv = clean_invoices(raw, report)
    bal = clean_cash_balances(raw, tx, report)
    report.facts.update(
        {
            "companies": raw.companies["company_id"].n_unique(),
            "companies_with_transactions": tx["company_id"].n_unique(),
            "companies_with_invoices": inv["company_id"].n_unique(),
            "companies_with_ar": inv.filter(pl.col("side") == "ar")[
                "company_id"
            ].n_unique(),
            "companies_with_ap": inv.filter(pl.col("side") == "ap")[
                "company_id"
            ].n_unique(),
            "transactions_kept": len(tx),
            "invoices_kept": len(inv),
        }
    )
    return CleanData(
        raw.companies,
        raw.products,
        tx,
        inv,
        bal,
        raw.debt_products,
        raw.balances,
        report,
    )
