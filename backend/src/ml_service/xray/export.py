"""Export scored panel to the JSON contract consumed by the web demo."""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import polars as pl

from ml_service.xray.config import FEATURE_SPECS, OUTPUT_DIR, PILLAR_LABELS_ES, PILLARS
from ml_service.xray.explain import explain_change, top_reasons
from ml_service.xray.explain.regime_es import REGIME_LABELS_ES
from ml_service.xray.export_web import export_company_files

N_REASONS = 3
ALERT_MONTHS = 24
__all__ = [
    "alert_records",
    "build_payload",
    "company_records",
    "export_company_files",
    "export_json",
    "export_submission",
    "write_payload",
]
RAW_FIELDS = (
    "inflow",
    "outflow",
    "net",
    "cash_end",
    "cash_min",
    "dso_days",
    "supplier_delay_days",
    "overdue_ar",
    "overdue_ap",
    "loc_utilization",
    "returned_debit_n",
    "stress_n",
    "n_tx",
    "n_counterparties",
    "debt_outstanding",
    "payroll",
    "tax_paid",
)


def _num(v: object) -> float | None:
    if v is None:
        return None
    f = float(v)  # type: ignore[arg-type]
    return None if math.isnan(f) else round(f, 4)


def _month_record(row: dict) -> dict:
    return {
        "month": row["month"].strftime("%Y-%m"),
        "score": _num(row["score"]),
        "score_raw": _num(row["score_raw"]),
        "composite": _num(row["composite"]),
        "p_stress": _num(row["p_stress"]),
        "trend_6m": _num(row["trend_6m"]),
        "direction": row["direction"],
        "regime": row["regime"],
        "regime_shift": _num(row["regime_shift"]),
        "changepoint_month": row["changepoint_month"].strftime("%Y-%m")
        if row["changepoint_month"]
        else None,
        "pillars": {p: _num(row[f"pillar_{p}"]) for p in PILLARS},
        "raw": {k: _num(row.get(k)) for k in RAW_FIELDS},
        "reasons": top_reasons(row, N_REASONS),
        "stress_now": int(row.get("stress_now") or 0),
    }


def company_records(scored: pl.DataFrame) -> list[dict]:
    """One record per company with its full monthly series and its explanation."""
    out = []
    for _, g in scored.sort("company_id", "month").group_by(
        "company_id", maintain_order=True
    ):
        rows = g.to_dicts()
        last = rows[-1]
        series = [_month_record(r) for r in rows]
        out.append(
            {
                "company_id": last["company_id"],
                "group_id": last["group_id"],
                "months_observed": len(rows),
                "score": _num(last["score"]),
                "score_prev": _num(rows[-2]["score"]) if len(rows) > 1 else None,
                "score_6m_ago": _num(rows[-7]["score"]) if len(rows) > 6 else None,
                "trend_6m": _num(last["trend_6m"]),
                "direction": last["direction"],
                "regime": last["regime"],
                "p_stress": _num(last["p_stress"]),
                "pillars": series[-1]["pillars"],
                "reasons": series[-1]["reasons"],
                "explanation": explain_change(rows),
                "series": series,
            }
        )
    return out


def alert_records(alerts: pl.DataFrame, months: int = ALERT_MONTHS) -> list[dict]:
    """Alerts of the last ``months`` calendar months, newest first."""
    if alerts.is_empty():
        return []
    cutoff = alerts["month"].max()
    recent = alerts.filter(
        pl.col("month") >= pl.lit(cutoff).dt.offset_by(f"-{months}mo")
    )
    rows = recent.sort("month", descending=True).to_dicts()
    return [{**r, "month": r["month"].strftime("%Y-%m")} for r in rows]


def build_payload(
    scored: pl.DataFrame, extra: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Assemble the full web payload (companies + labels + anything extra)."""
    payload: dict[str, Any] = {
        "generated_for": "HackSpain 2026 · Embat X-Ray",
        "pillar_labels": PILLAR_LABELS_ES,
        "feature_labels": {s.name: s.label_es for s in FEATURE_SPECS},
        "regime_labels": REGIME_LABELS_ES,
        "companies": company_records(scored),
    }
    payload.update(extra or {})
    return payload


def write_payload(
    payload: dict[str, Any], path: Path = OUTPUT_DIR / "xray_export.json"
) -> Path:
    """Write an already-built payload as a single JSON file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False))
    return path


def export_json(
    scored: pl.DataFrame,
    path: Path = OUTPUT_DIR / "xray_export.json",
    extra: dict | None = None,
) -> Path:
    """Write the full export (companies + metadata) as JSON and return its path."""
    return write_payload(build_payload(scored, extra), path)


def export_submission(
    scored: pl.DataFrame, path: Path = OUTPUT_DIR / "submission.csv"
) -> Path:
    """Leaderboard-style CSV: one row per company-month with score and direction."""
    cols = [
        "company_id",
        "month",
        "score",
        "p_stress",
        "trend_6m",
        "direction",
        "regime",
    ]
    scored.select(cols).with_columns(pl.col("month").dt.strftime("%Y-%m")).write_csv(
        path
    )
    return path
