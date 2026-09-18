"""Assemble the company x month panel with rolling, growth and ratio features."""

from __future__ import annotations

import polars as pl

from ml_service.xray.config import FIRST_MONTH, LAST_FULL_MONTH
from ml_service.xray.features.debt import build_debt_features
from ml_service.xray.features.invoices import build_invoice_features
from ml_service.xray.features.transactions import build_transaction_features
from ml_service.xray.io import Dataset

EPS = 1.0
FLOW_COLS = (
    "inflow", "outflow", "collections", "tax_paid", "payroll", "debt_repaid", "financing_cost",
    "financing_inflow", "n_tx", "n_inflows", "n_counterparties", "issued_ar", "issued_ap",
    "paid_ar", "paid_ap", "overdue_ar", "overdue_ap", "returned_debit_n", "returned_debit_amt",
    "overdraft_n", "late_fee_n", "seizure_n",
)


def _log_growth(cur: str, prev: str) -> pl.Expr:
    return (pl.col(cur) + EPS).log() - (pl.col(prev) + EPS).log()


def _grid(features: pl.DataFrame) -> pl.DataFrame:
    """Full monthly grid from each company's first active month to the last full month."""
    first = features.group_by("company_id").agg(pl.col("month").min().alias("start"))
    months = pl.DataFrame({"month": pl.datetime_range(FIRST_MONTH, LAST_FULL_MONTH, "1mo", eager=True)})
    return first.join(months, how="cross").filter(pl.col("month") >= pl.col("start")).drop("start")


def _rolling(panel: pl.DataFrame) -> pl.DataFrame:
    """Trailing sums / means over 3 and 6 months, per company (panel must be sorted)."""
    over = {"partition_by": "company_id"}
    exprs = []
    for c in ("inflow", "outflow", "collections", "payroll", "debt_repaid", "financing_cost", "n_tx", "n_counterparties", "issued_ar", "issued_ap", "returned_debit_n", "stress_n"):
        exprs.append(pl.col(c).rolling_sum(3, min_samples=1).over(**over).alias(f"{c}_3m"))
        exprs.append(pl.col(c).rolling_sum(3, min_samples=1).shift(3).over(**over).alias(f"{c}_prev3m"))
        exprs.append(pl.col(c).rolling_sum(6, min_samples=1).over(**over).alias(f"{c}_6m"))
    exprs += [
        pl.col("net").rolling_std(6, min_samples=3).over(**over).alias("net_std_6m"),
        (pl.col("net") > 0).cast(pl.Float64).rolling_mean(6, min_samples=1).over(**over).alias("net_positive_share_6m"),
        pl.col("cash_end").shift(3).over(**over).alias("cash_end_lag3"),
        pl.col("loc_utilization").shift(3).over(**over).alias("loc_util_lag3"),
        pl.col("delay_days_ar").rolling_mean(3, min_samples=1).over(**over).alias("dso_days"),
        pl.col("delay_days_ap").rolling_mean(3, min_samples=1).over(**over).alias("supplier_delay_days"),
        pl.col("tax_paid").gt(0).cast(pl.Float64).rolling_mean(6, min_samples=1).over(**over).alias("tax_regularity"),
        pl.col("month_index").alias("months_observed"),
    ]
    return panel.with_columns(exprs)


def _ratios(panel: pl.DataFrame) -> pl.DataFrame:
    """Scale-free ratios and growth rates used by the score."""
    avg_out = pl.col("outflow_3m") / 3 + EPS
    avg_in = pl.col("inflow_3m") / 3 + EPS
    return panel.with_columns(
        (pl.col("cash_end") / avg_out).clip(-12, 24).alias("cash_runway_months"),
        (pl.col("cash_end") / avg_in).clip(-12, 24).alias("cash_to_inflow"),
        (pl.col("cash_min") / avg_out).clip(-12, 24).alias("min_balance_ratio"),
        ((pl.col("cash_end") - pl.col("cash_end_lag3")) / (pl.col("cash_end_lag3").abs() + avg_out)).clip(-3, 3).alias("cash_change_3m"),
        ((pl.col("inflow") - pl.col("outflow")) / (pl.col("inflow") + pl.col("outflow") + EPS)).alias("net_margin"),
        ((pl.col("inflow_3m") - pl.col("outflow_3m")) / (pl.col("inflow_3m") + pl.col("outflow_3m") + EPS)).alias("net_margin_3m"),
        _log_growth("inflow_3m", "inflow_prev3m").clip(-3, 3).alias("inflow_growth_3m"),
        ((pl.col("inflow_6m") + EPS).log() - (pl.col("inflow_6m").shift(6).over("company_id") + EPS).log()).clip(-3, 3).alias("inflow_growth_6m"),
        (pl.col("net_std_6m") / avg_in).clip(0, 5).alias("inflow_volatility"),
        (pl.col("returned_debit_n_3m") / (pl.col("n_tx_3m") + EPS) * 100).alias("returned_debit_rate"),
        (pl.col("stress_n_3m") / (pl.col("n_tx_3m") + EPS) * 100).alias("stress_event_rate"),
        (pl.col("overdue_ap") / (pl.col("issued_ap_6m") + EPS)).clip(0, 3).alias("payables_overdue_share"),
        (pl.col("overdue_ar") / (pl.col("issued_ar_6m") + EPS)).clip(0, 3).alias("receivables_overdue_share"),
        _log_growth("collections_3m", "collections_prev3m").clip(-3, 3).alias("collection_growth_3m"),
        (pl.col("debt_repaid_3m") / (pl.col("inflow_3m") + EPS)).clip(0, 2).alias("debt_service_ratio"),
        (pl.col("financing_cost_3m") / (pl.col("inflow_3m") + EPS)).clip(0, 1).alias("financing_cost_ratio"),
        (pl.col("debt_outstanding") / (pl.col("inflow_6m") * 2 + EPS)).clip(0, 10).alias("leverage_ratio"),
        (pl.col("loc_utilization") - pl.col("loc_util_lag3")).alias("loc_util_change_3m"),
        _log_growth("n_tx_3m", "n_tx_prev3m").clip(-3, 3).alias("activity_growth_3m"),
        _log_growth("payroll_3m", "payroll_prev3m").clip(-3, 3).alias("payroll_growth_3m"),
        _log_growth("n_counterparties_3m", "n_counterparties_prev3m").clip(-3, 3).alias("counterparty_growth_3m"),
    )


def build_panel(ds: Dataset) -> pl.DataFrame:
    """Build the full monthly panel for every company in the dataset."""
    raw = build_transaction_features(ds)
    inv = build_invoice_features(ds)
    if inv.width > 2:
        raw = raw.join(inv, on=["company_id", "month"], how="full", coalesce=True)
    raw = raw.filter(pl.col("month") <= pl.lit(LAST_FULL_MONTH))
    panel = _grid(raw).join(raw, on=["company_id", "month"], how="left")
    panel = panel.join(build_debt_features(ds), on="company_id", how="left")
    panel = panel.join(ds.table("companies").select("company_id", "group_id"), on="company_id", how="left")
    fill = [pl.col(c).fill_null(0.0) for c in FLOW_COLS if c in panel.columns]
    panel = panel.sort("company_id", "month").with_columns(fill).with_columns(
        (pl.col("overdraft_n") + pl.col("late_fee_n") + pl.col("seizure_n")).alias("stress_n"),
        (pl.col("inflow") - pl.col("outflow")).alias("net"),
        pl.col("cash_end").forward_fill().over("company_id"),
        pl.col("cash_min").forward_fill().over("company_id"),
        pl.col("neg_balance_share").fill_null(0.0),
        pl.col("debt_outstanding").fill_null(0.0),
        pl.col("customer_concentration").forward_fill().over("company_id"),
        (pl.col("loc_drawn") / (pl.col("loc_limit") + EPS)).clip(0, 1.5).forward_fill().over("company_id").alias("loc_utilization"),
        (pl.int_range(pl.len()).over("company_id") + 1).alias("month_index"),
    )
    return _ratios(_rolling(panel))
