"""Spanish wording for the regime labels: a dip is not the same as a fall."""

from __future__ import annotations

from typing import Any

from ml_service.xray.explain.format_es import month_label, points_phrase

REGIME_LABELS_ES: dict[str, str] = {
    "steady": "Estable",
    "structural_decline": "Caída estructural",
    "structural_improvement": "Mejora estructural",
    "transient_dip": "Bache puntual",
    "transient_spike": "Repunte puntual",
}


def regime_text_es(row: dict[str, Any]) -> str:
    """Explain the current regime, telling a transient dip apart from a real fall.

    Args:
        row: Scored row with ``regime``, ``regime_shift`` and ``changepoint_month``.

    Returns:
        One Spanish sentence ready to show next to the score.
    """
    regime = row.get("regime") or "steady"
    shift = float(row.get("regime_shift") or 0.0)
    when = month_label(row.get("changepoint_month"))
    points = points_phrase(shift)
    if regime == "structural_decline":
        return (
            f"Caída estructural: el nivel medio del score bajó {points} desde {when} "
            "y se ha mantenido ahí. No es un bache, es el nuevo nivel."
        )
    if regime == "structural_improvement":
        return (
            f"Mejora estructural: el nivel medio del score subió {points} desde {when} "
            "y se ha consolidado."
        )
    if regime == "transient_dip":
        return (
            f"Bache puntual: hubo una caída de hasta {points} en los últimos meses, "
            "pero el score ya ha vuelto a su nivel previo."
        )
    if regime == "transient_spike":
        return (
            f"Repunte puntual: hubo una subida de hasta {points} en los últimos meses, "
            "pero el score ha vuelto a su nivel previo."
        )
    return "Sin cambio de régimen: la trayectoria se mantiene en su nivel habitual."
