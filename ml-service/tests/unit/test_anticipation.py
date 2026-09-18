"""Unit tests for the anticipation / lead-time protocol (synthetic frames)."""

from __future__ import annotations

import json
from datetime import datetime

import polars as pl
import pytest

from ml_service.xray.anticipation import (
    anticipation_report,
    auroc_by_horizon,
    lead_times,
    score_curve,
    stress_events,
)
from ml_service.xray.anticipation.events import false_alarm_rate, with_stress_flag
from ml_service.xray.monitor import ALERT_SCHEMA, EARLY_WARNING_TYPES

TYPES = EARLY_WARNING_TYPES


def months(n: int) -> list[datetime]:
    """``n`` consecutive months starting at 2025-01."""
    return [datetime(2025 + (i // 12), (i % 12) + 1, 1) for i in range(n)]


def panel(
    stress: list[int], company: str = "COMP_A", scores: list[float] | None = None
):
    """Panel whose stress months are driven by ``returned_debit_n``."""
    n = len(stress)
    return pl.DataFrame(
        {
            "company_id": [company] * n,
            "month": months(n),
            "score": scores if scores is not None else [70.0 - 5.0 * s for s in stress],
            "cash_end": [100.0] * n,
            "returned_debit_n": [float(s) for s in stress],
            "stress_n": [0.0] * n,
            "payables_overdue_share": [0.0] * n,
            "loc_utilization": [None] * n,
            "neg_balance_share": [0.0] * n,
        }
    ).with_columns(
        pl.col("month").cast(pl.Datetime("us")),
        pl.col("loc_utilization").cast(pl.Float64),
    )


def alerts(rows: list[tuple[str, int, str]]):
    """Alert frame from ``(company_id, month_index, type)`` triples."""
    stamps = months(36)
    return pl.DataFrame(
        [
            {
                "company_id": company,
                "month": stamps[index],
                "type": kind,
                "severity": "warning",
                "title_es": "t",
                "detail_es": "d",
                "score": 50.0,
                "delta": -9.0,
            }
            for company, index, kind in rows
        ],
        schema=ALERT_SCHEMA,
    )


def test_with_stress_flag_ignores_missing_inputs() -> None:
    """A null ``loc_utilization`` must not turn the whole flag into a null."""
    flagged = with_stress_flag(panel([0, 0, 1, 0]))
    assert flagged["_stress"].to_list() == [0, 0, 1, 0]


def test_with_stress_flag_falls_back_to_stress_now() -> None:
    frame = pl.DataFrame(
        {
            "company_id": ["A", "A"],
            "month": months(2),
            "stress_now": [None, 1],
        }
    )
    assert with_stress_flag(frame)["_stress"].to_list() == [0, 1]


def test_stress_events_need_three_clean_months() -> None:
    events = stress_events(panel([0, 0, 0, 1, 1, 0, 1]))
    assert events.height == 1
    assert events["month"][0] == datetime(2025, 4, 1)


def test_stress_events_skip_the_first_months() -> None:
    """Without three observed clean months there is no confirmed onset."""
    assert stress_events(panel([0, 1, 0, 0, 0, 0])).is_empty()


def test_lead_times_take_the_earliest_alert_in_the_window() -> None:
    events = stress_events(panel([0, 0, 0, 0, 0, 0, 0, 0, 0, 1]))
    leads = lead_times(
        events,
        alerts([("COMP_A", 5, "score_drop"), ("COMP_A", 7, "score_drop")]),
        TYPES,
    )
    assert leads[0]["lead"] == 4
    assert leads[0]["alert_type"] == "score_drop"


def test_lead_times_ignore_alerts_outside_the_window_and_after_the_event() -> None:
    events = stress_events(panel([0] * 15 + [1]))
    late = lead_times(events, alerts([("COMP_A", 15, "score_drop")]), TYPES)
    far = lead_times(events, alerts([("COMP_A", 2, "score_drop")]), TYPES)
    assert late[0]["lead"] is None
    assert far[0]["lead"] is None


def test_lead_times_mark_missed_events() -> None:
    events = stress_events(panel([0, 0, 0, 0, 0, 1]))
    leads = lead_times(events, alerts([]), TYPES)
    assert leads[0]["lead"] is None
    assert leads[0]["alert_type"] is None


def test_false_alarm_rate_counts_alerts_without_a_following_event() -> None:
    frame = panel([0, 0, 0, 0, 0, 1, 0, 0])
    events = stress_events(frame)
    raised = alerts([("COMP_A", 3, "score_drop"), ("COMP_A", 20, "liquidity_squeeze")])
    result = false_alarm_rate(events, raised, TYPES, frame.height)
    assert result["alerts_evaluated"] == 2
    assert result["false_alarms"] == 1
    assert result["by_type"]["score_drop"]["false_alarms"] == 0
    assert result["by_type"]["liquidity_squeeze"]["false_alarms"] == 1


def test_score_curve_spans_the_documented_offsets() -> None:
    frame = panel([0, 0, 0, 0, 0, 1, 0, 0])
    curve = score_curve(frame, stress_events(frame))
    assert [point["offset"] for point in curve] == list(range(-9, 4))
    at_event = next(point for point in curve if point["offset"] == 0)
    assert at_event["n"] == 1
    assert at_event["mean_score"] == pytest.approx(65.0)


def test_auroc_is_perfect_when_the_score_separates_stress() -> None:
    stress = [0, 1] * 40
    # The score at t must anticipate the stress at t + 1, not mirror it.
    scores = [20.0 if stress[i + 1] else 80.0 for i in range(len(stress) - 1)] + [80.0]
    frame = panel(stress, scores=scores)
    result = auroc_by_horizon(frame, horizons=(1,))
    assert result["h1"]["auroc"] == pytest.approx(1.0)
    assert result["h1"]["n"] == len(stress) - 1


def test_auroc_is_none_on_a_tiny_sample() -> None:
    frame = panel([0, 1, 0, 1])
    assert auroc_by_horizon(frame, horizons=(1,))["h1"]["auroc"] is None


def test_anticipation_report_is_json_serialisable() -> None:
    frame = pl.concat(
        [
            panel([0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1], company="COMP_A"),
            panel([0] * 12, company="COMP_B"),
        ]
    )
    raised = alerts([("COMP_A", 2, "score_drop"), ("COMP_B", 4, "liquidity_squeeze")])
    report = anticipation_report(frame, raised)
    assert report["n_companies"] == 2
    assert report["lead_time"]["n_events"] >= 1
    assert set(report["lead_time"]["detection_rate"]) == {f"h{h}" for h in range(1, 7)}
    assert report["auroc_oof"] is None
    assert json.loads(json.dumps(report))["n_company_months"] == frame.height
