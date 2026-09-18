"""Unit tests for the final score blend, its scaling and the smoothing."""

from __future__ import annotations

from datetime import datetime

import numpy as np
import polars as pl
import pytest

from ml_service.xray.score.scoring import (
    SMOOTH_ALPHA,
    _pdo_scale,
    _theil_sen,
    calibrate,
    final_scores,
    fit_calibration,
)

MONTHS = [datetime(2025, m, 1) for m in range(1, 13)]


def _panel(composite: list[float], p_stress: list[float] | None = None) -> pl.DataFrame:
    n = len(composite)
    return pl.DataFrame(
        {
            "company_id": ["C1"] * n,
            "month": MONTHS[:n],
            "composite": composite,
            "p_stress": p_stress or [0.25] * n,
            "pred_future_composite": composite,
        }
    )


def test_pdo_scale_is_decreasing_in_risk():
    """More stress probability always means fewer points."""
    points = _pdo_scale(np.array([0.01, 0.1, 0.5, 0.9]))
    assert list(points) == sorted(points, reverse=True)
    assert points.min() >= 0.0 and points.max() <= 100.0


def test_pdo_scale_doubles_odds_every_pdo_points():
    """Halving the odds of stress is worth exactly one PDO step."""
    a = _pdo_scale(np.array([1 / 3]), pdo=12.0)[0]
    b = _pdo_scale(np.array([1 / 5]), pdo=12.0)[0]
    assert b - a == pytest.approx(12.0, abs=0.2)


def test_theil_sen_recovers_a_clean_slope():
    """The robust slope equals the true slope on a straight line."""
    assert _theil_sen(np.array([10.0, 12.0, 14.0, 16.0])) == pytest.approx(2.0)


def test_theil_sen_ignores_a_single_outlier():
    """One wild month does not flip the trend."""
    clean = _theil_sen(np.array([10.0, 12.0, 14.0, 16.0, 18.0]))
    noisy = _theil_sen(np.array([10.0, 12.0, 14.0, -80.0, 18.0]))
    assert noisy == pytest.approx(clean, abs=0.5)


def test_calibration_stretches_to_the_full_range():
    """The calibrated score spans 3..97 whatever the raw blend looked like."""
    raw = np.linspace(40.0, 60.0, 500)
    grid = fit_calibration(raw)
    out = calibrate(raw, grid)
    assert out.min() == pytest.approx(3.0, abs=0.5)
    assert out.max() == pytest.approx(97.0, abs=0.5)
    assert np.all(np.diff(out) >= -1e-9)


def test_final_scores_blends_level_forward_and_risk():
    """The raw blend is the documented weighted sum of its three parts."""
    out = final_scores(_panel([60.0] * 3))
    stress_pts = _pdo_scale(np.array([0.25]))[0]
    expected = 0.45 * 60 + 0.35 * 60 + 0.20 * stress_pts
    assert out["score_raw"][0] == pytest.approx(expected)


def test_smoothing_dampens_a_single_bad_month():
    """One bad month moves the score less than the raw blend."""
    out = final_scores(_panel([70.0, 70.0, 20.0, 70.0]))
    raw = out["score_raw"].to_list()
    score = out["score"].to_list()
    assert score[0] == pytest.approx(raw[0])
    assert score[2] > raw[2]
    assert abs(score[2] - score[1]) < abs(raw[2] - raw[1])
    assert 0 < SMOOTH_ALPHA < 1


def test_direction_labels_follow_the_trend():
    """A sustained rise reads as improving, a sustained fall as deteriorating."""
    up = final_scores(_panel([40.0 + 5 * i for i in range(8)]))
    down = final_scores(_panel([90.0 - 5 * i for i in range(8)]))
    assert up["direction"].to_list()[-1] == "improving"
    assert down["direction"].to_list()[-1] == "deteriorating"
    assert up["trend_6m"].to_list()[0] is None or np.isnan(up["trend_6m"][0])


def test_score_delta_is_per_company():
    """The month-over-month delta never crosses a company boundary."""
    panel = pl.concat(
        [
            _panel([50.0] * 3),
            _panel([90.0] * 3).with_columns(pl.lit("C2").alias("company_id")),
        ]
    )
    out = final_scores(panel).sort("company_id", "month")
    assert out["score_delta_1m"][0] is None
    assert out.filter(pl.col("company_id") == "C2")["score_delta_1m"][0] is None
