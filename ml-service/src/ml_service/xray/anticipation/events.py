"""Evident stress events and the lead time of the alerts that preceded them."""

from __future__ import annotations

from datetime import datetime
from typing import Any

import numpy as np
import polars as pl

from ml_service.xray.score.targets import STRESS_RULES, stress_flag

CLEAN_MONTHS = 3
LOOKBACK = 9
FOLLOW_UP = 6
CURVE_RANGE = (-9, 3)


def abs_month(month: datetime) -> int:
    """Calendar month as an absolute integer, so differences are month counts."""
    return month.year * 12 + month.month


def with_stress_flag(panel: pl.DataFrame) -> pl.DataFrame:
    """Add ``_stress`` (0/1), recomputed from the raw rules whenever possible.

    Panels written before the null-handling fix in
    :func:`ml_service.xray.score.targets.stress_flag` carry a ``stress_now``
    that is null for most rows, so the flag is rebuilt from the raw columns when
    they are all present and only read from ``stress_now`` as a fallback.
    """
    if all(column in panel.columns for column in STRESS_RULES):
        return panel.with_columns(stress_flag().alias("_stress"))
    return panel.with_columns(
        pl.col("stress_now").cast(pl.Int32).fill_null(0).alias("_stress")
    )


def stress_events(scored: pl.DataFrame) -> pl.DataFrame:
    """Onset months: stress fires after at least three clean months.

    Args:
        scored: Scored panel with the raw stress columns (or ``stress_now``).

    Returns:
        Frame with ``company_id`` and ``month``, one row per event onset.
    """
    ordered = with_stress_flag(scored.sort("company_id", "month"))
    clean = pl.all_horizontal(
        [
            pl.col("_stress").shift(k).over("company_id") == 0
            for k in range(1, CLEAN_MONTHS + 1)
        ]
    )
    return ordered.filter((pl.col("_stress") == 1) & clean).select(
        "company_id", "month"
    )


def _by_company(
    alerts: pl.DataFrame, types: tuple[str, ...]
) -> dict[str, list[tuple[int, str]]]:
    selected = (
        alerts.filter(pl.col("type").is_in(list(types)))
        if not alerts.is_empty()
        else alerts
    )
    out: dict[str, list[tuple[int, str]]] = {}
    for row in selected.to_dicts():
        out.setdefault(row["company_id"], []).append(
            (abs_month(row["month"]), row["type"])
        )
    for values in out.values():
        values.sort()
    return out


def lead_times(
    events: pl.DataFrame,
    alerts: pl.DataFrame,
    types: tuple[str, ...],
    lookback: int = LOOKBACK,
) -> list[dict[str, object]]:
    """For each event, the earliest qualifying alert inside the lookback window.

    Args:
        events: Output of :func:`stress_events`.
        alerts: Alert frame from the monitor.
        types: Alert types that count as an early warning.
        lookback: How many months before the event an alert still counts.

    Returns:
        One dict per event with ``company_id``, ``month``, ``lead`` (months of
        anticipation, ``None`` when the event was missed) and ``alert_type``.
    """
    index = _by_company(alerts, types)
    out: list[dict[str, object]] = []
    for row in events.to_dicts():
        target = abs_month(row["month"])
        window = [
            (m, t)
            for m, t in index.get(row["company_id"], [])
            if 1 <= target - m <= lookback
        ]
        first = window[0] if window else None
        out.append(
            {
                "company_id": row["company_id"],
                "month": row["month"].strftime("%Y-%m"),
                "lead": target - first[0] if first else None,
                "alert_type": first[1] if first else None,
            }
        )
    return out


def false_alarm_rate(
    events: pl.DataFrame,
    alerts: pl.DataFrame,
    types: tuple[str, ...],
    company_months: int,
    follow_up: int = FOLLOW_UP,
) -> dict[str, Any]:
    """Share of early-warning alerts with no event in the following months."""
    by_company: dict[str, list[int]] = {}
    for row in events.to_dicts():
        by_company.setdefault(row["company_id"], []).append(abs_month(row["month"]))
    evaluated = alerts.filter(pl.col("type").is_in(list(types))).to_dicts()
    per_type: dict[str, list[int]] = {}
    for row in evaluated:
        missed = not any(
            0 < target - abs_month(row["month"]) <= follow_up
            for target in by_company.get(row["company_id"], [])
        )
        bucket = per_type.setdefault(row["type"], [0, 0])
        bucket[0] += 1
        bucket[1] += int(missed)
    false_alarms = sum(bucket[1] for bucket in per_type.values())
    total = len(evaluated)
    return {
        "alerts_evaluated": total,
        "false_alarms": int(false_alarms),
        "false_alarm_share": round(false_alarms / total, 4) if total else 0.0,
        "per_company_month": round(false_alarms / company_months, 5)
        if company_months
        else 0.0,
        "by_type": {
            kind: {"alerts": n, "false_alarms": bad, "share": round(bad / n, 4)}
            for kind, (n, bad) in sorted(per_type.items())
        },
    }


def score_curve(
    scored: pl.DataFrame, events: pl.DataFrame
) -> list[dict[str, float | int]]:
    """Mean score by months-to-event: the shape that shows the early warning."""
    lookup: dict[tuple[str, int], float] = {
        (row["company_id"], abs_month(row["month"])): row["score"]
        for row in scored.select("company_id", "month", "score").to_dicts()
    }
    out: list[dict[str, float | int]] = []
    for offset in range(CURVE_RANGE[0], CURVE_RANGE[1] + 1):
        values = [
            lookup[(row["company_id"], abs_month(row["month"]) + offset)]
            for row in events.to_dicts()
            if (row["company_id"], abs_month(row["month"]) + offset) in lookup
        ]
        clean = [v for v in values if v is not None and not np.isnan(v)]
        out.append(
            {
                "offset": offset,
                "n": len(clean),
                "mean_score": round(float(np.mean(clean)), 2) if clean else None,
            }
        )
    return out
