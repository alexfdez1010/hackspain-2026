"""Unit tests for the regime detector (transient dip vs structural change)."""

from __future__ import annotations

from datetime import datetime

import polars as pl

from ml_service.xray.score.regime import add_regimes

MONTHS = [datetime(2025, m, 1) for m in range(1, 13)]


def _panel(scores: list[float], company: str = "C1") -> pl.DataFrame:
    return pl.DataFrame(
        {
            "company_id": [company] * len(scores),
            "month": MONTHS[: len(scores)],
            "score": scores,
        }
    )


def test_flat_series_is_steady():
    """A company that never moves is never flagged."""
    out = add_regimes(_panel([70.0] * 10))
    assert set(out["regime"].to_list()) == {"steady"}
    assert out["changepoint_month"].null_count() == 10


def test_persistent_drop_is_structural():
    """A level shift that holds for several months is a structural decline."""
    out = add_regimes(_panel([80.0] * 6 + [45.0] * 6)).sort("month")
    labels = out["regime"].to_list()
    assert labels[-1] == "structural_decline"
    assert out["regime_shift"].to_list()[-1] < -8.0
    assert out["changepoint_month"].to_list()[-1] == datetime(2025, 7, 1)


def test_persistent_rise_is_structural_improvement():
    """The detector is symmetric: a held rise is a structural improvement."""
    out = add_regimes(_panel([40.0] * 6 + [75.0] * 6)).sort("month")
    assert out["regime"].to_list()[-1] == "structural_improvement"
    assert out["regime_shift"].to_list()[-1] > 8.0


def test_dip_that_reverts_is_transient():
    """A one-month hole that recovers is labelled a transient dip, not a decline."""
    out = add_regimes(_panel([70.0, 70.0, 70.0, 70.0, 45.0, 69.0])).sort("month")
    assert out["regime"].to_list()[-1] == "transient_dip"
    assert out["regime_shift"].to_list()[-1] < 0


def test_labels_are_point_in_time():
    """The label at month m is identical whether or not later months exist."""
    full = add_regimes(_panel([80.0] * 6 + [45.0] * 6)).sort("month")
    prefix = add_regimes(_panel([80.0] * 6 + [45.0] * 2)).sort("month")
    assert full["regime"].to_list()[:8] == prefix["regime"].to_list()


def test_companies_are_labelled_independently():
    """One company's collapse does not contaminate another's label."""
    panel = pl.concat(
        [_panel([70.0] * 8), _panel([80.0] * 4 + [30.0] * 4, company="C2")]
    )
    out = add_regimes(panel)
    c1 = out.filter(pl.col("company_id") == "C1")
    assert set(c1["regime"].to_list()) == {"steady"}
