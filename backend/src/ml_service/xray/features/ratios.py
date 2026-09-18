"""Scale-free ratios and growth rates that feed the score."""

from __future__ import annotations

import polars as pl

EPS = 1.0


def _log_growth(cur: str, prev: str) -> pl.Expr:
    return (pl.col(cur) + EPS).log() - (pl.col(prev) + EPS).log()


def add_ratios(panel: pl.DataFrame) -> pl.DataFrame:
    """Scale-free ratios and growth rates used by the score."""
    avg_out = pl.col("outflow_3m") / 3 + EPS
    avg_in = pl.col("inflow_3m") / 3 + EPS
    return panel.with_columns(
        (pl.col("cash_end") / avg_out).clip(-12, 24).alias("cash_runway_months"),
        (pl.col("cash_end") / avg_in).clip(-12, 24).alias("cash_to_inflow"),
        (pl.col("cash_min") / avg_out).clip(-12, 24).alias("min_balance_ratio"),
        (
            (pl.col("cash_end") - pl.col("cash_end_lag3"))
            / (pl.col("cash_end_lag3").abs() + avg_out)
        )
        .clip(-3, 3)
        .alias("cash_change_3m"),
        (
            (pl.col("inflow") - pl.col("outflow"))
            / (pl.col("inflow") + pl.col("outflow") + EPS)
        ).alias("net_margin"),
        (
            (pl.col("inflow_3m") - pl.col("outflow_3m"))
            / (pl.col("inflow_3m") + pl.col("outflow_3m") + EPS)
        ).alias("net_margin_3m"),
        _log_growth("inflow_3m", "inflow_prev3m").clip(-3, 3).alias("inflow_growth_3m"),
        (
            (pl.col("inflow_6m") + EPS).log()
            - (pl.col("inflow_6m").shift(6).over("company_id") + EPS).log()
        )
        .clip(-3, 3)
        .alias("inflow_growth_6m"),
        (pl.col("net_std_6m") / avg_in).clip(0, 5).alias("inflow_volatility"),
        (pl.col("returned_debit_n_3m") / (pl.col("n_tx_3m") + EPS) * 100).alias(
            "returned_debit_rate"
        ),
        (pl.col("stress_n_3m") / (pl.col("n_tx_3m") + EPS) * 100).alias(
            "stress_event_rate"
        ),
        (pl.col("overdue_ap") / (pl.col("issued_ap_6m") + EPS))
        .clip(0, 3)
        .alias("payables_overdue_share"),
        (pl.col("overdue_ar") / (pl.col("issued_ar_6m") + EPS))
        .clip(0, 3)
        .alias("receivables_overdue_share"),
        _log_growth("collections_3m", "collections_prev3m")
        .clip(-3, 3)
        .alias("collection_growth_3m"),
        (pl.col("debt_repaid_3m") / (pl.col("inflow_3m") + EPS))
        .clip(0, 2)
        .alias("debt_service_ratio"),
        (pl.col("financing_cost_3m") / (pl.col("inflow_3m") + EPS))
        .clip(0, 1)
        .alias("financing_cost_ratio"),
        (pl.col("debt_outstanding") / (pl.col("inflow_6m") * 2 + EPS))
        .clip(0, 10)
        .alias("leverage_ratio"),
        (pl.col("loc_utilization") - pl.col("loc_util_lag3")).alias(
            "loc_util_change_3m"
        ),
        _log_growth("n_tx_3m", "n_tx_prev3m").clip(-3, 3).alias("activity_growth_3m"),
        _log_growth("payroll_3m", "payroll_prev3m")
        .clip(-3, 3)
        .alias("payroll_growth_3m"),
        _log_growth("n_counterparties_3m", "n_counterparties_prev3m")
        .clip(-3, 3)
        .alias("counterparty_growth_3m"),
    )
