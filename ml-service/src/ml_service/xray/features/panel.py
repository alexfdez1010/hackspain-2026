"""Assemble the company x month panel with rolling, growth and ratio features."""

from __future__ import annotations

import polars as pl

from ml_service.xray.config import FIRST_MONTH, LAST_FULL_MONTH
from ml_service.xray.features.debt import build_debt_features
from ml_service.xray.features.invoices import build_invoice_features
from ml_service.xray.features.ratios import add_ratios
from ml_service.xray.features.transactions import build_transaction_features
from ml_service.xray.io import Dataset

EPS = 1.0
FLOW_COLS = (
    "inflow",
    "outflow",
    "collections",
    "tax_paid",
    "payroll",
    "debt_repaid",
    "financing_cost",
    "financing_inflow",
    "n_tx",
    "n_inflows",
    "n_counterparties",
    "issued_ar",
    "issued_ap",
    "paid_ar",
    "paid_ap",
    "overdue_ar",
    "overdue_ap",
    "returned_debit_n",
    "returned_debit_amt",
    "overdraft_n",
    "late_fee_n",
    "seizure_n",
)


OPTIONAL_COLS = (
    "issued_ar",
    "issued_ap",
    "n_issued_ar",
    "n_issued_ap",
    "delay_days_ar",
    "delay_days_ap",
    "late_share_ar",
    "late_share_ap",
    "paid_ar",
    "paid_ap",
    "overdue_ar",
    "overdue_ap",
    "n_overdue_ar",
    "n_overdue_ap",
    "customer_concentration",
    "n_customers",
    "loc_drawn",
    "loc_limit",
    "debt_outstanding",
    "debt_granted",
)


def _ensure_columns(frame: pl.DataFrame) -> pl.DataFrame:
    """Add any optional input column that a sparse dataset (e.g. no invoices) lacks."""
    missing = [
        pl.lit(None, dtype=pl.Float64).alias(c)
        for c in OPTIONAL_COLS
        if c not in frame.columns
    ]
    return frame.with_columns(missing) if missing else frame


def _grid(features: pl.DataFrame) -> pl.DataFrame:
    """Full monthly grid from each company's first active month to the last full month."""
    first = features.group_by("company_id").agg(pl.col("month").min().alias("start"))
    months = pl.DataFrame(
        {"month": pl.datetime_range(FIRST_MONTH, LAST_FULL_MONTH, "1mo", eager=True)}
    )
    return (
        first.join(months, how="cross")
        .filter(pl.col("month") >= pl.col("start"))
        .drop("start")
    )


def _rolling(panel: pl.DataFrame) -> pl.DataFrame:
    """Trailing sums / means over 3 and 6 months, per company (panel must be sorted)."""
    over = {"partition_by": "company_id"}
    exprs = []
    for c in (
        "inflow",
        "outflow",
        "collections",
        "payroll",
        "debt_repaid",
        "financing_cost",
        "n_tx",
        "n_counterparties",
        "issued_ar",
        "issued_ap",
        "returned_debit_n",
        "stress_n",
    ):
        exprs.append(
            pl.col(c).rolling_sum(3, min_samples=1).over(**over).alias(f"{c}_3m")
        )
        exprs.append(
            pl.col(c)
            .rolling_sum(3, min_samples=1)
            .shift(3)
            .over(**over)
            .alias(f"{c}_prev3m")
        )
        exprs.append(
            pl.col(c).rolling_sum(6, min_samples=1).over(**over).alias(f"{c}_6m")
        )
    exprs += [
        pl.col("net").rolling_std(6, min_samples=3).over(**over).alias("net_std_6m"),
        (pl.col("net") > 0)
        .cast(pl.Float64)
        .rolling_mean(6, min_samples=1)
        .over(**over)
        .alias("net_positive_share_6m"),
        pl.col("cash_end").shift(3).over(**over).alias("cash_end_lag3"),
        pl.col("loc_utilization").shift(3).over(**over).alias("loc_util_lag3"),
        pl.col("delay_days_ar")
        .rolling_mean(3, min_samples=1)
        .over(**over)
        .alias("dso_days"),
        pl.col("delay_days_ap")
        .rolling_mean(3, min_samples=1)
        .over(**over)
        .alias("supplier_delay_days"),
        pl.col("tax_paid")
        .gt(0)
        .cast(pl.Float64)
        .rolling_mean(6, min_samples=1)
        .over(**over)
        .alias("tax_regularity"),
        pl.col("month_index").alias("months_observed"),
    ]
    return panel.with_columns(exprs)


def build_panel(ds: Dataset) -> pl.DataFrame:
    """Build the full monthly panel for every company in the dataset."""
    raw = build_transaction_features(ds)
    inv = build_invoice_features(ds)
    if inv.width > 2:
        raw = raw.join(inv, on=["company_id", "month"], how="full", coalesce=True)
    raw = raw.filter(pl.col("month") <= pl.lit(LAST_FULL_MONTH))
    raw = _ensure_columns(raw)
    panel = _grid(raw).join(raw, on=["company_id", "month"], how="left")
    debt = build_debt_features(ds)
    if debt.width > 1:
        panel = panel.join(debt, on="company_id", how="left")
    panel = _ensure_columns(panel)
    panel = panel.join(
        ds.table("companies").select("company_id", "group_id"),
        on="company_id",
        how="left",
    )
    fill = [pl.col(c).fill_null(0.0) for c in FLOW_COLS if c in panel.columns]
    panel = (
        panel.sort("company_id", "month")
        .with_columns(fill)
        .with_columns(
            (pl.col("overdraft_n") + pl.col("late_fee_n") + pl.col("seizure_n")).alias(
                "stress_n"
            ),
            (pl.col("inflow") - pl.col("outflow")).alias("net"),
            pl.col("cash_end").forward_fill().over("company_id"),
            pl.col("cash_min").forward_fill().over("company_id"),
            pl.col("neg_balance_share").fill_null(0.0),
            pl.col("debt_outstanding").fill_null(0.0),
            pl.col("customer_concentration").forward_fill().over("company_id"),
            (pl.col("loc_drawn") / (pl.col("loc_limit") + EPS))
            .clip(0, 1.5)
            .forward_fill()
            .over("company_id")
            .alias("loc_utilization"),
            (pl.int_range(pl.len()).over("company_id") + 1).alias("month_index"),
        )
    )
    return add_ratios(_rolling(panel))
