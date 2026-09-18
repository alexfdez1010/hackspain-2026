"""Unit tests for the alert engine (synthetic in-memory frames, no disk)."""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime

import numpy as np
import polars as pl
import pytest

from ml_service.xray.monitor import alert_counts, build_alerts, build_series
from ml_service.xray.monitor.rules_cash import liquidity_squeeze, payment_stress
from ml_service.xray.monitor.rules_risk import score_drop, stress_risk_high
from ml_service.xray.monitor.signals import (
    crossing_up,
    cusum_alarm,
    lagged_diff,
    newly,
    persistent,
    with_cooldown,
)

N_MONTHS = 14


def months(n: int = N_MONTHS) -> list[datetime]:
    """Monthly timestamps starting at 2025-01."""
    return [datetime(2025 + (i // 12), (i % 12) + 1, 1) for i in range(n)]


def panel(**columns: list[float] | list[str]) -> pl.DataFrame:
    """Build a one-company scored panel with sensible defaults."""
    n = len(next(iter(columns.values())))
    base = {
        "company_id": ["COMP_TEST"] * n,
        "month": months(n),
        "score": [70.0] * n,
        "p_stress": [0.1] * n,
        "regime": ["steady"] * n,
        "regime_shift": [0.0] * n,
        "changepoint_month": [None] * n,
        "cash_runway_months": [5.0] * n,
        "returned_debit_n": [0.0] * n,
        "payables_overdue_share": [0.0] * n,
    }
    base.update(columns)
    return pl.DataFrame(base).with_columns(
        pl.col("changepoint_month").cast(pl.Datetime("us")),
        pl.col("month").cast(pl.Datetime("us")),
    )


def only(series_frame: pl.DataFrame, rule: Callable[..., list[dict]]) -> list[dict]:
    """Run a single rule over the only company in the frame."""
    return rule(build_series(series_frame)[0])


def test_cusum_alarm_needs_accumulated_losses() -> None:
    steady = np.full(10, 70.0)
    assert not cusum_alarm(steady).any()
    falling = 70.0 - np.arange(10) * 4.0
    assert cusum_alarm(falling)[-1]
    # A single bad month followed by recovery must not raise the alarm.
    blip = np.array([70.0, 70.0, 64.0, 70.0, 70.0, 70.0])
    assert not cusum_alarm(blip).any()


def test_persistent_requires_consecutive_months() -> None:
    mask = np.array([True, False, True, True, False])
    assert list(persistent(mask, 2)) == [False, False, False, True, False]
    assert list(persistent(mask, 1)) == list(mask)


def test_lagged_diff_and_crossings() -> None:
    values = np.array([10.0, 12.0, 9.0, 4.0])
    diff = lagged_diff(values, 2)
    assert np.isnan(diff[:2]).all()
    assert diff[2] == pytest.approx(-1.0)
    assert list(crossing_up(np.array([0.1, 0.6, 0.7, 0.2]), 0.5)) == [
        False,
        True,
        False,
        False,
    ]
    assert list(newly(["a", "b", "b", "a"], "b")) == [False, True, False, False]


def test_with_cooldown_drops_close_repeats() -> None:
    assert with_cooldown(np.array([1, 2, 5, 9]), 3) == [1, 5, 9]


def test_score_drop_fires_on_sustained_fall() -> None:
    scores = [80.0, 80.0, 80.0, 74.0, 68.0, 62.0, 56.0, 50.0, 50.0, 50.0]
    alerts = only(panel(score=scores), score_drop)
    assert alerts, "a 30 point slide must raise an alert"
    assert alerts[0]["type"] == "score_drop"
    assert alerts[0]["severity"] == "critical"
    assert "puntos" in alerts[0]["detail_es"]


def test_score_drop_ignores_a_single_bad_month() -> None:
    scores = [80.0, 80.0, 80.0, 71.0, 80.0, 80.0, 80.0, 80.0]
    assert only(panel(score=scores), score_drop) == []


def test_stress_risk_high_only_on_upward_crossing() -> None:
    probs = [0.1, 0.2, 0.62, 0.7, 0.8, 0.2, 0.1, 0.1]
    alerts = only(panel(p_stress=probs), stress_risk_high)
    assert len(alerts) == 1
    assert alerts[0]["severity"] == "warning"
    assert "62%" in alerts[0]["detail_es"]


def test_liquidity_squeeze_needs_two_consecutive_months() -> None:
    runway = [3.0, 0.2, 3.0, 3.0, 0.15, 0.1, 3.0, 3.0]
    alerts = only(panel(cash_runway_months=runway), liquidity_squeeze)
    assert len(alerts) == 1
    assert alerts[0]["month"] == datetime(2025, 6, 1)
    assert alerts[0]["severity"] == "critical"


def test_payment_stress_reports_the_numbers() -> None:
    returned = [0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    overdue = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.9, 0.0]
    alerts = only(
        panel(returned_debit_n=returned, payables_overdue_share=overdue), payment_stress
    )
    assert len(alerts) == 2
    assert "3 recibos devueltos" in alerts[0]["detail_es"]
    assert "90%" in alerts[1]["detail_es"]


def test_build_alerts_returns_the_documented_schema() -> None:
    frame = panel(score=[80.0, 80.0, 80.0, 70.0, 62.0, 55.0, 48.0, 48.0])
    alerts = build_alerts(frame)
    assert set(alerts.columns) == {
        "company_id",
        "month",
        "type",
        "severity",
        "title_es",
        "detail_es",
        "score",
        "delta",
    }
    assert alerts.height >= 1
    assert alert_counts(alerts)["score_drop"] >= 1


def test_build_alerts_on_an_empty_panel() -> None:
    empty = panel(score=[70.0]).clear()
    assert build_alerts(empty).is_empty()
    assert alert_counts(build_alerts(empty)) == {}
