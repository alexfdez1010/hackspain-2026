"""Assemble the company x month panel with the 11 PULSE variables."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.clean.pipeline import CleanData
from ml_service.pulse.features.cash import cash_features
from ml_service.pulse.features.credit import credit_line_features, maturity_features
from ml_service.pulse.features.months import month_grid
from ml_service.pulse.features.network import network_features
from ml_service.pulse.features.payables import payables_features
from ml_service.pulse.features.receivables import receivables_features

KEY = ["company_id", "month"]


def build_panel(clean: CleanData) -> pl.DataFrame:
    """Dense panel from each company's first transaction month to the last full month."""
    first = clean.transactions.group_by("company_id").agg(
        pl.col("date").min().dt.truncate("1mo").alias("first_month")
    )
    grid = month_grid(first)
    panel = cash_features(clean.transactions, clean.cash_balances, grid)
    panel = credit_line_features(
        clean.transactions, clean.debt_products, clean.balances_snapshot, panel
    )
    panel = maturity_features(clean.transactions, clean.debt_products, panel)
    panel = panel.join(payables_features(clean.invoices, grid), on=KEY, how="left")
    panel = panel.join(receivables_features(clean.invoices, grid), on=KEY, how="left")
    panel = panel.join(network_features(clean.invoices, grid), on=KEY, how="left")
    panel = panel.join(
        clean.companies.select("company_id", "group_id"), on="company_id", how="left"
    )
    return panel.sort(KEY).with_columns(
        (pl.int_range(pl.len()).over("company_id") + 1).alias("months_observed")
    )
