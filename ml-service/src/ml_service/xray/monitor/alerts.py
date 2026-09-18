"""Alert record shape shared by every monitoring rule."""

from __future__ import annotations

import math
from typing import Any

import polars as pl

from ml_service.xray.monitor.series import CompanySeries

SEVERITIES: tuple[str, ...] = ("info", "warning", "critical")
ALERT_SCHEMA: dict[str, Any] = {
    "company_id": pl.String,
    "month": pl.Datetime("us"),
    "type": pl.String,
    "severity": pl.String,
    "title_es": pl.String,
    "detail_es": pl.String,
    "score": pl.Float64,
    "delta": pl.Float64,
}


def _clean(value: float | None) -> float | None:
    if value is None or math.isnan(float(value)):
        return None
    return round(float(value), 3)


def make_alert(
    series: CompanySeries,
    index: int,
    kind: str,
    severity: str,
    title_es: str,
    detail_es: str,
    delta: float | None,
) -> dict[str, Any]:
    """Build one alert record for month ``index`` of ``series``.

    Args:
        series: The company the alert belongs to.
        index: Position of the triggering month in the series.
        kind: Alert type identifier (``score_drop``, ``improvement``, ...).
        severity: One of :data:`SEVERITIES`.
        title_es: Short Spanish headline.
        detail_es: Spanish sentence carrying the actual numbers.
        delta: Signed magnitude that triggered the rule, for sorting/filtering.

    Returns:
        A dict matching :data:`ALERT_SCHEMA`.
    """
    return {
        "company_id": series.company_id,
        "month": series.months[index],
        "type": kind,
        "severity": severity,
        "title_es": title_es,
        "detail_es": detail_es,
        "score": _clean(series.score[index]),
        "delta": _clean(delta),
    }
