"""Lead-time measurement protocol: how early does the monitor see trouble?"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import polars as pl

from ml_service.xray.anticipation.events import (
    LOOKBACK,
    false_alarm_rate,
    lead_times,
    score_curve,
    stress_events,
)
from ml_service.xray.anticipation.metrics import auroc_by_horizon
from ml_service.xray.config import OUTPUT_DIR
from ml_service.xray.monitor import EARLY_WARNING_TYPES, alert_counts

DETECTION_HORIZONS: tuple[int, ...] = (1, 2, 3, 4, 5, 6)
DEFINITIONS_ES = {
    "evento": "Primer mes de un episodio de tensión tras al menos 3 meses limpios.",
    "lead_time": "Meses entre la primera alerta temprana (ventana de 9 meses) y el evento.",
    "deteccion_h": "Porcentaje de eventos avisados con al menos h meses de antelación.",
    "falsa_alarma": "Alerta temprana sin ningún evento en los 6 meses siguientes.",
    "auroc_h": "Capacidad del score de hoy para ordenar la tensión en (t, t+h].",
}


def _lead_summary(leads: list[dict[str, Any]]) -> dict[str, Any]:
    values = [item["lead"] for item in leads if item["lead"] is not None]
    array = np.array(values, dtype=float)
    detection = {
        f"h{h}": round(float((array >= h).sum()) / len(leads), 4) if leads else None
        for h in DETECTION_HORIZONS
    }
    return {
        "n_events": len(leads),
        "n_events_alerted": len(values),
        "share_events_alerted": round(len(values) / len(leads), 4) if leads else 0.0,
        "median_lead_months": round(float(np.median(array)), 2) if values else None,
        "mean_lead_months": round(float(array.mean()), 2) if values else None,
        "p25_lead_months": round(float(np.percentile(array, 25)), 2)
        if values
        else None,
        "p75_lead_months": round(float(np.percentile(array, 75)), 2)
        if values
        else None,
        "lead_histogram": {
            str(k): int((array == k).sum()) for k in range(1, LOOKBACK + 1)
        },
        "detection_rate": detection,
        "by_alert_type": alert_counts(
            pl.DataFrame({"type": [i["alert_type"] for i in leads if i["alert_type"]]})
        )
        if any(i["alert_type"] for i in leads)
        else {},
    }


def anticipation_report(
    scored: pl.DataFrame,
    alerts: pl.DataFrame,
    oof: pl.DataFrame | None = None,
    oof_score_col: str = "score",
) -> dict[str, Any]:
    """Measure how much warning the monitor gives before an evident stress event.

    Args:
        scored: Scored panel (needs ``score`` and ``stress_now``).
        alerts: Alert frame produced by the monitor.
        oof: Optional out-of-fold frame with a score column, for the honest
            unseen-company AUROC.
        oof_score_col: Score column inside ``oof``.

    Returns:
        A JSON-serialisable dict with lead-time statistics, detection rates,
        false-alarm rates, the months-to-event score curve and AUROC by horizon.
    """
    events = stress_events(scored)
    leads = lead_times(events, alerts, EARLY_WARNING_TYPES)
    report: dict[str, Any] = {
        "n_companies": int(scored["company_id"].n_unique()),
        "n_company_months": int(scored.height),
        "early_warning_types": list(EARLY_WARNING_TYPES),
        "lookback_months": LOOKBACK,
        "lead_time": _lead_summary(leads),
        "false_alarms": false_alarm_rate(
            events, alerts, EARLY_WARNING_TYPES, scored.height
        ),
        "population_mean_score": round(float(scored["score"].mean()), 2),
        "score_by_months_to_event": score_curve(scored, events),
        "auroc_in_sample": auroc_by_horizon(scored),
        "auroc_oof": auroc_by_horizon(oof, oof_score_col) if oof is not None else None,
        "alert_counts": alert_counts(alerts),
        "definitions_es": DEFINITIONS_ES,
    }
    return report


def save_report(
    report: dict[str, Any], path: Path = OUTPUT_DIR / "anticipation.json"
) -> Path:
    """Write the anticipation report as JSON and return its path."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    return path
