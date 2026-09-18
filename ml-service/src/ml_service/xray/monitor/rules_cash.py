"""Cash and payment-behaviour rules, plus the positive improvement alert."""

from __future__ import annotations

from typing import Any

import numpy as np

from ml_service.xray.explain.format_es import month_label
from ml_service.xray.monitor.alerts import make_alert
from ml_service.xray.monitor.series import CompanySeries
from ml_service.xray.monitor.signals import (
    lagged_diff,
    newly,
    persistent,
    with_cooldown,
)

IMPROVE_LAG = 6
IMPROVE_POINTS = 10.0
COOLDOWN = 3
RUNWAY_MONTHS = 0.25
RUNWAY_PERSISTENCE = 2
RETURNED_DEBITS = 2.0
OVERDUE_AP_SHARE = 0.75


def improvement(series: CompanySeries) -> list[dict[str, Any]]:
    """Score up at least 10 points in 6 months, or a new structural improvement."""
    gain = lagged_diff(series.score, IMPROVE_LAG)
    upturn = newly(series.regime, "structural_improvement")
    hit = (gain >= IMPROVE_POINTS) | upturn
    out: list[dict[str, Any]] = []
    for i in with_cooldown(np.flatnonzero(hit), COOLDOWN):
        points = (
            float(gain[i])
            if not np.isnan(gain[i])
            else float(series.col("regime_shift")[i])
        )
        if upturn[i]:
            when = month_label(series.changepoint_month[i])
            detail = (
                f"Mejora estructural confirmada desde {when}: el nivel medio del score ha "
                f"subido {abs(float(series.col('regime_shift')[i])):.0f} puntos y se mantiene."
            )
        else:
            detail = (
                f"El score ha subido {points:.0f} puntos en {IMPROVE_LAG} meses "
                f"({series.score[i - IMPROVE_LAG]:.0f}→{series.score[i]:.0f}). "
                "Buen momento para renegociar financiación o ampliar líneas."
            )
        out.append(
            make_alert(
                series, i, "improvement", "info", "Mejora sostenida", detail, points
            )
        )
    return out


def liquidity_squeeze(series: CompanySeries) -> list[dict[str, Any]]:
    """Cash covers less than a week of outflows, two months in a row."""
    runway = series.col("cash_runway_months")
    hit = persistent(runway < RUNWAY_MONTHS, RUNWAY_PERSISTENCE)
    out: list[dict[str, Any]] = []
    for i in with_cooldown(np.flatnonzero(hit), COOLDOWN):
        months = float(runway[i])
        detail = (
            f"La caja cubre {months:.2f} meses de salidas (menos de una semana) por segundo mes "
            "consecutivo. Riesgo inmediato de descubierto."
        )
        out.append(
            make_alert(
                series,
                i,
                "liquidity_squeeze",
                "critical",
                "Tensión de liquidez",
                detail,
                months,
            )
        )
    return out


def payment_stress(series: CompanySeries) -> list[dict[str, Any]]:
    """Returned direct debits or a large share of overdue supplier invoices."""
    returned = series.col("returned_debit_n")
    overdue = series.col("payables_overdue_share")
    hit = (returned >= RETURNED_DEBITS) | (overdue > OVERDUE_AP_SHARE)
    out: list[dict[str, Any]] = []
    for i in with_cooldown(np.flatnonzero(hit), COOLDOWN):
        parts: list[str] = []
        if returned[i] >= RETURNED_DEBITS:
            parts.append(f"{returned[i]:.0f} recibos devueltos este mes")
        if overdue[i] > OVERDUE_AP_SHARE:
            parts.append(f"{overdue[i]:.0%} de las facturas de proveedor vencidas")
        detail = "Señales de estrés en pagos: " + " y ".join(parts) + "."
        out.append(
            make_alert(
                series,
                i,
                "payment_stress",
                "warning",
                "Estrés en pagos",
                detail,
                float(returned[i])
                if returned[i] >= RETURNED_DEBITS
                else float(overdue[i]),
            )
        )
    return out
