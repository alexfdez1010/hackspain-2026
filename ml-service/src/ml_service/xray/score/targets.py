"""Self-supervised forward-looking targets built from each company's own future."""

from __future__ import annotations

import polars as pl

HORIZON = 6
STRESS_RULES = {
    "cash_end": ("lt", 0.0),
    "returned_debit_n": ("ge", 1.0),
    "stress_n": ("ge", 1.0),
    "payables_overdue_share": ("gt", 0.25),
    "loc_utilization": ("gt", 0.95),
    "neg_balance_share": ("gt", 0.5),
}


def _future_any(col: str, op: str, thr: float, horizon: int) -> pl.Expr:
    base = pl.col(col)
    cond = {"lt": base < thr, "gt": base > thr, "ge": base >= thr}[op]
    shifted = [cond.shift(-k).over("company_id").fill_null(False) for k in range(1, horizon + 1)]
    return pl.any_horizontal(shifted)


def add_targets(panel: pl.DataFrame, horizon: int = HORIZON) -> pl.DataFrame:
    """Add ``y_stress`` (future stress event) and ``y_future_composite`` columns.

    ``has_future`` marks rows where the full horizon is observable; only those
    rows are used for training.
    """
    panel = panel.sort("company_id", "month")
    stress_terms = [_future_any(c, op, thr, horizon) for c, (op, thr) in STRESS_RULES.items()]
    # Count how many of the next `horizon` months are stressful -> persistent stress.
    monthly_stress = pl.any_horizontal(
        [
            {"lt": pl.col(c) < t, "gt": pl.col(c) > t, "ge": pl.col(c) >= t}[op]
            for c, (op, t) in STRESS_RULES.items()
        ]
    ).cast(pl.Int32)
    n_stress = pl.sum_horizontal(
        [monthly_stress.shift(-k).over("company_id").fill_null(0) for k in range(1, horizon + 1)]
    )
    return panel.with_columns(
        pl.any_horizontal(stress_terms).alias("y_stress_any"),
        (n_stress >= 2).alias("y_stress"),
        pl.col("composite").shift(-horizon).over("company_id").alias("y_future_composite"),
        pl.col("composite").shift(-horizon).over("company_id").is_not_null().alias("has_future"),
        monthly_stress.alias("stress_now"),
    )
