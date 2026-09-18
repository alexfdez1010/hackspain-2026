"""Alert engine: run every monitoring rule over every company series."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

import polars as pl

from ml_service.xray.monitor.alerts import ALERT_SCHEMA
from ml_service.xray.monitor.rules_cash import (
    improvement,
    liquidity_squeeze,
    payment_stress,
)
from ml_service.xray.monitor.rules_risk import (
    score_drop,
    stress_risk_high,
    structural_decline,
)
from ml_service.xray.monitor.series import CompanySeries, build_series

Rule = Callable[[CompanySeries], list[dict[str, Any]]]

RULES: tuple[Rule, ...] = (
    score_drop,
    structural_decline,
    stress_risk_high,
    improvement,
    liquidity_squeeze,
    payment_stress,
)
EARLY_WARNING_TYPES: tuple[str, ...] = (
    "score_drop",
    "structural_decline",
    "stress_risk_high",
    "liquidity_squeeze",
)


def build_alerts(scored: pl.DataFrame) -> pl.DataFrame:
    """Run all rules over a scored panel and return one row per alert.

    Every rule is point-in-time: month ``m`` only uses data up to ``m``.
    Repeats of the same alert type within three months are suppressed.

    Args:
        scored: Scored panel with at least ``company_id``, ``month`` and ``score``.

    Returns:
        Frame with ``company_id``, ``month``, ``type``, ``severity``,
        ``title_es``, ``detail_es``, ``score`` and ``delta``, sorted by company
        and month.
    """
    records: list[dict[str, Any]] = []
    for series in build_series(scored):
        for rule in RULES:
            records.extend(rule(series))
    if not records:
        return pl.DataFrame(schema=ALERT_SCHEMA)
    return pl.DataFrame(records, schema=ALERT_SCHEMA).sort(
        "company_id", "month", "type"
    )


def alert_counts(alerts: pl.DataFrame) -> dict[str, int]:
    """Number of alerts per type, most frequent first."""
    if alerts.is_empty():
        return {}
    grouped = alerts.group_by("type").len().sort("len", descending=True)
    return {row["type"]: int(row["len"]) for row in grouped.to_dicts()}
