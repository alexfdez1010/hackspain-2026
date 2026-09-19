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
CATALOGUE_FILE = "catalogue.json"
"""``summary.json`` without the company rows: what the web app bundles and the API serves as catalogue."""


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
    mirror_dir: Path | None = None,
) -> Path:
    """Recommend every snapshot and write ``summary.json``, ``catalogue.json``, ``companies/<id>.json`` and ``snapshots.json``.

    ``mirror_dir`` receives a copy of what the web app bundles: the catalogue and
    the per-company files, never the portfolio rows or the snapshots.
    """
    shutil.rmtree(out_dir, ignore_errors=True)
    (out_dir / "companies").mkdir(parents=True)
    rows = []
    for s in snapshots:
        payload = recommender.recommend(s)
        (out_dir / "companies" / f"{s.company_id}.json").write_text(
            json.dumps(payload, ensure_ascii=False)
        )
        rows.append(summary_row(payload))
    catalogue = catalogue_payload(risk_evaluation)
    summary = {**catalogue, "companies": rows}
    (out_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False))
    (out_dir / CATALOGUE_FILE).write_text(json.dumps(catalogue, ensure_ascii=False))
    (out_dir / SNAPSHOTS_FILE).write_text(
        json.dumps([s.to_dict() for s in snapshots], ensure_ascii=False)
    )
    if mirror_dir is not None:
        mirror(out_dir, mirror_dir)
    return out_dir


def mirror(out_dir: Path, mirror_dir: Path) -> Path:
    """Copy ``catalogue.json`` and ``companies/`` from ``out_dir`` into the web app's data folder."""
    shutil.rmtree(mirror_dir, ignore_errors=True)
    mirror_dir.mkdir(parents=True)
    shutil.copy(out_dir / CATALOGUE_FILE, mirror_dir / CATALOGUE_FILE)
    shutil.copytree(out_dir / "companies", mirror_dir / "companies")
    return mirror_dir


def web_mirror_dir() -> Path:
    """Where the frontend bundles the recommendations (``frontend/src/data/pulse/recommendations``)."""
    from ml_service.pulse.config import ML_ROOT

    return ML_ROOT.parent / "frontend" / "src" / "data" / "pulse" / "recommendations"
