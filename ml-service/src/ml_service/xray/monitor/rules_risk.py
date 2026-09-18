"""Deterioration rules: score drop, structural decline and stress probability."""

from __future__ import annotations

from typing import Any

import numpy as np

from ml_service.xray.explain.format_es import month_label
from ml_service.xray.monitor.alerts import make_alert
from ml_service.xray.monitor.series import CompanySeries
from ml_service.xray.monitor.signals import (
    crossing_up,
    cusum_alarm,
    lagged_diff,
    newly,
    persistent,
    with_cooldown,
)

DROP_LAG = 3
DROP_POINTS = 8.0
CRITICAL_DROP = 15.0
PERSISTENCE = 2
COOLDOWN = 3
STRESS_THRESHOLD = 0.5
STRESS_CRITICAL = 0.7


def score_drop(series: CompanySeries) -> list[dict[str, Any]]:
    """Score fell at least 8 points in 3 months with a confirming CUSUM alarm."""
    drop = lagged_diff(series.score, DROP_LAG)
    hit = persistent((drop <= -DROP_POINTS) & cusum_alarm(series.score), PERSISTENCE)
    out: list[dict[str, Any]] = []
    for i in with_cooldown(np.flatnonzero(hit), COOLDOWN):
        points = float(drop[i])
        detail = (
            f"El score ha bajado {abs(points):.0f} puntos en {DROP_LAG} meses "
            f"({series.score[i - DROP_LAG]:.0f}→{series.score[i]:.0f}) y la señal "
            "acumulada (CUSUM) confirma que la caída es sostenida, no ruido."
        )
        severity = "critical" if points <= -CRITICAL_DROP else "warning"
        out.append(
            make_alert(
                series, i, "score_drop", severity, "Caída del score", detail, points
            )
        )
    return out


def structural_decline(series: CompanySeries) -> list[dict[str, Any]]:
    """The company just entered a structural decline regime (not a transient dip)."""
    hit = newly(series.regime, "structural_decline")
    out: list[dict[str, Any]] = []
    for i in with_cooldown(np.flatnonzero(hit), COOLDOWN):
        shift = float(series.col("regime_shift")[i])
        when = month_label(series.changepoint_month[i])
        detail = (
            f"Cambio de régimen detectado en {when}: el nivel medio del score ha bajado "
            f"{abs(shift):.0f} puntos y se mantiene. No es un bache puntual."
        )
        out.append(
            make_alert(
                series,
                i,
                "structural_decline",
                "critical",
                "Deterioro estructural",
                detail,
                shift,
            )
        )
    return out


def stress_risk_high(series: CompanySeries) -> list[dict[str, Any]]:
    """Probability of cash stress in the next 6 months crosses 0.5 from below."""
    probability = series.col("p_stress")
    hit = crossing_up(probability, STRESS_THRESHOLD)
    out: list[dict[str, Any]] = []
    for i in with_cooldown(np.flatnonzero(hit), COOLDOWN):
        now = float(probability[i])
        before = float(probability[i - 1]) if i else float("nan")
        previous = "s/d" if np.isnan(before) else f"{before:.0%}"
        detail = (
            f"La probabilidad de tensión de tesorería en los próximos 6 meses sube a "
            f"{now:.0%} (mes anterior {previous}). Conviene revisar caja y cobros."
        )
        severity = "critical" if now >= STRESS_CRITICAL else "warning"
        out.append(
            make_alert(
                series,
                i,
                "stress_risk_high",
                severity,
                "Riesgo de impago elevado",
                detail,
                now,
            )
        )
    return out
