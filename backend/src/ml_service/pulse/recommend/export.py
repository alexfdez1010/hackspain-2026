"""Write the recommendations as JSON: one portfolio summary plus one file per company."""

from __future__ import annotations

import json
import shutil
from dataclasses import asdict
from pathlib import Path

from ml_service.pulse.recommend import config as cfg
from ml_service.pulse.recommend.catalogue import PRODUCTS
from ml_service.pulse.recommend.engine import Recommender, summary_row
from ml_service.pulse.recommend.pricing import STRESS_TO_DEFAULT
from ml_service.pulse.recommend.snapshot import CompanySnapshot

GENERATED_FOR = "HackSpain 2026 · Embat PULSE Advisor"
SNAPSHOTS_FILE = "snapshots.json"
"""Inputs of every recommendation, so the API can re-price them for another reference rate."""


def catalogue_payload(risk_evaluation: dict | None = None) -> dict:
    """Static description of products and pricing parameters, for the API and the UI."""
    return {
        "generated_for": GENERATED_FOR,
        "reference_rate": {"label": cfg.REFERENCE_RATE_LABEL, "value": cfg.EURIBOR_12M},
        "pricing_parameters": {
            "max_risk_premium_bps": cfg.MAX_RISK_PREMIUM_BPS,
            "max_data_uncertainty_bps": cfg.MAX_DATA_UNCERTAINTY_BPS,
            "stress_to_default": STRESS_TO_DEFAULT,
            "trend_decline_bps": cfg.TREND_DECLINE_BPS,
            "trend_improve_bps": cfg.TREND_IMPROVE_BPS,
            "min_confidence_for_credit": cfg.MIN_CONFIDENCE_FOR_CREDIT,
        },
        "products": [asdict(p) for p in PRODUCTS],
        "risk_model": risk_evaluation or {},
    }


def write_all(
    recommender: Recommender,
    snapshots: list[CompanySnapshot],
    out_dir: Path,
    risk_evaluation: dict | None = None,
) -> Path:
    """Recommend every snapshot and write ``summary.json``, ``companies/<id>.json`` and ``snapshots.json``."""
    shutil.rmtree(out_dir, ignore_errors=True)
    (out_dir / "companies").mkdir(parents=True)
    rows = []
    for s in snapshots:
        payload = recommender.recommend(s)
        (out_dir / "companies" / f"{s.company_id}.json").write_text(
            json.dumps(payload, ensure_ascii=False)
        )
        rows.append(summary_row(payload))
    summary = {**catalogue_payload(risk_evaluation), "companies": rows}
    (out_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False))
    (out_dir / SNAPSHOTS_FILE).write_text(
        json.dumps([s.to_dict() for s in snapshots], ensure_ascii=False)
    )
    return out_dir
