"""Signals as the JSON the web app and the API consume, keyed by company."""

from __future__ import annotations

import json
from pathlib import Path

import polars as pl

from ml_service.pulse.signals.explain import detail, drivers, headline, kind_of
from ml_service.pulse.variables import PILLARS

SIGNALS_FILE = "signals.parquet"
EVALUATION_FILE = "signals_evaluation.json"


def _num(x) -> float | None:
    return None if x is None else round(float(x), 2)


def signal_payload(row: dict) -> dict:
    """One signal with its figures, its narrative and, when known, its outcome."""
    kind = kind_of(row["direction"], row.get("p_persistent"))
    moved = drivers(row)
    persistent = row.get("persistent")
    return {
        "month": row["month"].strftime("%Y-%m"),
        "kind": kind,
        "direction": "down" if int(row["direction"]) < 0 else "up",
        "level": _num(row["level"]),
        "baseline": _num(row["baseline"]),
        "move": _num(row["move"]),
        "breadth": int(row["breadth"]),
        "confidence": _num(row["confidence"]),
        "pillar_deltas": {p: _num(row[f"delta_{p}"]) for p in PILLARS},
        "drivers": moved,
        "p_persistent": _num(row.get("p_persistent")),
        "outcome": None
        if persistent is None
        else ("persistente" if persistent else "transitorio"),
        "headline": headline(row, kind),
        "detail": detail(row, kind, moved),
    }


def signals_by_company(work_dir: Path) -> dict[str, list[dict]]:
    """Every company's signals, oldest first; empty when the build has not run."""
    path = work_dir / SIGNALS_FILE
    if not path.exists():
        return {}
    out: dict[str, list[dict]] = {}
    for row in pl.read_parquet(path).sort("company_id", "month").to_dicts():
        out.setdefault(row["company_id"], []).append(signal_payload(row))
    return out


def evaluation_block(work_dir: Path) -> dict:
    """Published anticipation curve and persistence-model figures; empty when missing."""
    path = work_dir / EVALUATION_FILE
    if not path.exists():
        return {}
    data = json.loads(path.read_text())
    return {
        "anticipation": data.get("anticipation", {}),
        "persistence": data.get("persistence", {}),
    }
