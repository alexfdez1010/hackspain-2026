"""Unit tests for the self-supervised forward targets (no leakage allowed)."""

from __future__ import annotations

from datetime import datetime

import polars as pl

from ml_service.xray.score.targets import HORIZON, add_targets

MONTHS = [datetime(2025, m, 1) for m in range(1, 13)]


def _panel(
    company: str = "C1", stressed: tuple[int, ...] = (), n: int = 12
) -> pl.DataFrame:
    """Panel whose composite ramps up and whose stress months are explicit."""
    return pl.DataFrame(
        {
            "company_id": [company] * n,
            "month": MONTHS[:n],
            "composite": [50.0 + i for i in range(n)],
            "cash_end": [-1.0 if i in stressed else 10.0 for i in range(n)],
            "returned_debit_n": [0.0] * n,
            "stress_n": [0.0] * n,
            "payables_overdue_share": [0.0] * n,
            "loc_utilization": [0.0] * n,
            "neg_balance_share": [0.0] * n,
        }
    )


def test_future_composite_is_the_value_h_months_later():
    """``y_future_composite`` is the composite shifted back by the horizon."""
    out = add_targets(_panel()).sort("month")
    composite = out["composite"].to_list()
    future = out["y_future_composite"].to_list()
    for i in range(len(composite) - HORIZON):
        assert future[i] == composite[i + HORIZON]
    assert future[-HORIZON:] == [None] * HORIZON


def test_has_future_marks_only_fully_observable_rows():
    """Only rows whose whole horizon is inside the panel can be trained on."""
    out = add_targets(_panel()).sort("month")
    assert out["has_future"].to_list() == [True] * 6 + [False] * 6


def test_stress_needs_two_stressed_months_inside_the_window():
    """One bad month ahead is noise; two make the label positive."""
    out = add_targets(_panel(stressed=(8, 9))).sort("month")
    assert out["y_stress"].to_list() == [False] * 3 + [True] * 5 + [False] * 4


def test_current_month_stress_is_not_part_of_its_own_label():
    """The label is strictly forward looking, so month t never labels itself."""
    out = add_targets(_panel(stressed=(0, 1))).sort("month")
    assert out["y_stress"][0] is False
    assert out["stress_now"].to_list()[:3] == [1, 1, 0]
    assert out["y_stress_any"][0] is True


def test_labels_never_cross_company_boundaries():
    """A company's future is its own; the next company's rows are invisible."""
    panel = pl.concat([_panel("C1"), _panel("C2", stressed=(0, 1, 2, 3))])
    out = add_targets(panel).filter(pl.col("company_id") == "C1")
    assert out["y_stress"].to_list() == [False] * 12
    assert out["y_future_composite"].to_list()[-HORIZON:] == [None] * HORIZON
