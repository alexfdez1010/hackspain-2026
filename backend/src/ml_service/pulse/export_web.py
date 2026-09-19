"""Export PULSE history + forecasts as the JSON contract consumed by the web app and the API.

Writes ``<work_dir>/web/summary.json`` and ``<work_dir>/web/companies/<company_id>.json``
and optionally mirrors them into the frontend's bundled data folder.
"""

from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

import polars as pl

from ml_service.pulse.forecast.attribution import BASE, CONTEXT
from ml_service.pulse.forecast.config import HORIZONS
from ml_service.pulse.variables import PILLARS, VARIABLES

GENERATED_FOR = "HackSpain 2026 · Embat PULSE"
SCORE_EXPANSION = "Payment, Underwriting, Liquidity & Solvency Estimate"
PILLAR_LABELS = {
    "liquidez": "Liquidez",
    "deuda": "Deuda y servicio",
    "cobro": "Calidad de cobro",
    "pago": "Comportamiento de pago",
}
RAW_OF = {
    "cash_days": "cash_days",
    "cash_min": "cash_min_ratio",
    "loc_util": "loc_util",
    "loc_accel": "loc_accel",
    "dpo": "dpo_days",
    "terms": "terms_days",
    "dso": "dso_days",
    "ar90": "ar90_share",
    "top_client": "top_client_growth",
    "maturities": "maturities_ratio",
    "network": "network_exposure",
}
UNITS = {
    "cash_days": "días",
    "cash_min": "x salidas mensuales",
    "loc_util": "% del límite",
    "loc_accel": "pts",
    "dpo": "días",
    "terms": "días",
    "dso": "días",
    "ar90": "% de la cartera",
    "top_client": "% vs trimestre anterior",
    "maturities": "x caja",
    "network": "pts de salud de clientes",
}
CONTRIB_KEYS = [v.key for v in VARIABLES] + [CONTEXT, BASE]
FORECAST_EVAL_KEYS = (
    "n",
    "mae_persist",
    "mae_reversion",
    "mae_ml",
    "gain_vs_persist_pct",
    "gain_vs_reversion_pct",
    "direction_accuracy_big_moves",
    "recall_declines",
    "recall_improvements",
    "band_p10_p90_coverage",
)


def _num(x) -> float | None:
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return None
    return round(float(x), 2)


def _read_json(path: Path) -> dict:
    return json.loads(path.read_text()) if path.exists() else {}


def evaluation_payload(work_dir: Path) -> dict:
    """Published evaluation figures of the score, the forecast and the risk model.

    Everything is read from the JSON files the ``evaluate`` commands write, so the
    method page of the web app quotes the same numbers as the backend docs. A
    missing file leaves its block empty instead of failing the export.
    """
    score = _read_json(work_dir / "evaluation.json")
    forecast = _read_json(work_dir / "forecast_evaluation.json")
    risk = _read_json(work_dir / "risk_evaluation.json")
    return {
        "score": {
            "rows": score.get("rows"),
            "stress_rate": score.get("stress_rate"),
            "auroc": score.get("auroc_pulse"),
            "auroc_excluding_current_stress": score.get(
                "auroc_pulse_excluding_current_stress"
            ),
            "auroc_temporal": score.get("auroc_temporal_from_2025_09"),
            "auroc_by_variable": score.get("auroc_by_variable", {}),
        },
        "forecast": {
            "horizons": {
                str(h): {k: v.get(k) for k in FORECAST_EVAL_KEYS}
                for h, v in forecast.get("horizons", {}).items()
            }
        },
        "risk": {
            "rows": risk.get("rows"),
            "stress_rate": risk.get("stress_rate"),
            "auroc": risk.get("oof_auroc"),
            "coefficients_std": risk.get("coefficients_std", {}),
        },
    }


def metadata(work_dir: Path | None = None) -> dict:
    """Score metadata shared by every export; ``work_dir`` adds the evaluation block."""
    return {
        "generated_for": GENERATED_FOR,
        "score_name": "PULSE",
        "score_expansion": SCORE_EXPANSION,
        "horizons": list(HORIZONS),
        "pillars": [
            {
                "key": p,
                "label": PILLAR_LABELS[p],
                "weight": sum(v.weight for v in VARIABLES if v.pillar == p),
            }
            for p in PILLARS
        ],
        "variables": [
            {
                "key": v.key,
                "number": v.number,
                "label": v.label_es,
                "pillar": v.pillar,
                "weight": v.weight,
                "raw": RAW_OF[v.key],
                "unit": UNITS[v.key],
            }
            for v in VARIABLES
        ],
        "contribution_keys": CONTRIB_KEYS,
        "evaluation": evaluation_payload(work_dir) if work_dir else {},
    }


def _series_row(r: dict) -> dict:
    return {
        "month": r["month"].strftime("%Y-%m"),
        "pulse": _num(r["pulse"]),
        "pulse_raw": _num(r["pulse_raw"]),
        "confidence": _num(r["confidence"]),
        "pillars": {p: _num(r[f"pillar_{p}"]) for p in PILLARS},
        "variables": {
            v.key: {
                "score": _num(r[f"var_{v.key}"]),
                "raw": _num(r[RAW_OF[v.key]]),
                "known": bool(r[f"var_{v.key}__known"]),
            }
            for v in VARIABLES
        },
        "contributions": {v.key: _num(r[f"contrib_{v.key}"]) for v in VARIABLES},
        "cash_end": _num(r["cash_end"]),
    }


def _forecast_row(r: dict) -> dict:
    return {
        "horizon": int(r["horizon"]),
        "target_month": r["target_month"].strftime("%Y-%m"),
        "pulse_pred": _num(r["pulse_pred"]),
        "pulse_p10": _num(r["pulse_p10"]),
        "pulse_p90": _num(r["pulse_p90"]),
        "delta_raw": _num(r["delta_raw"]),
        "contributions": {k: _num(r[f"contrib_{k}"]) for k in CONTRIB_KEYS},
    }


def company_payload(history: pl.DataFrame, forecast: pl.DataFrame) -> dict:
    """Full payload for one company: monthly series plus the forecast made at the last month."""
    rows = history.sort("month").to_dicts()
    last, prev = rows[-1], (rows[-2] if len(rows) > 1 else None)
    fc = forecast.sort("horizon").to_dicts()
    return {
        "company_id": last["company_id"],
        "group_id": last["group_id"],
        "months_observed": int(last["months_observed"]),
        "month": last["month"].strftime("%Y-%m"),
        "pulse": _num(last["pulse"]),
        "pulse_prev": _num(prev["pulse"]) if prev else None,
        "confidence": _num(last["confidence"]),
        "pillars": {p: _num(last[f"pillar_{p}"]) for p in PILLARS},
        "series": [_series_row(r) for r in rows],
        "forecast": [_forecast_row(r) for r in fc],
    }


def write_all(work_dir: Path, mirror_dir: Path | None = None) -> Path:
    """Build every JSON file from ``scored_panel.parquet`` and ``forecast.parquet``."""
    scored = pl.read_parquet(work_dir / "scored_panel.parquet").filter(
        pl.col("pulse").is_not_null()
    )
    forecast = pl.read_parquet(work_dir / "forecast.parquet")
    web = work_dir / "web"
    shutil.rmtree(web, ignore_errors=True)
    (web / "companies").mkdir(parents=True)
    summary_rows = []
    for (cid,), hist in scored.group_by("company_id", maintain_order=True):
        payload = company_payload(hist, forecast.filter(pl.col("company_id") == cid))
        (web / "companies" / f"{cid}.json").write_text(
            json.dumps(payload, ensure_ascii=False)
        )
        h6 = next((f for f in payload["forecast"] if f["horizon"] == 6), None)
        summary_rows.append(
            {
                "company_id": cid,
                "group_id": payload["group_id"],
                "months_observed": payload["months_observed"],
                "pulse": payload["pulse"],
                "pulse_prev": payload["pulse_prev"],
                "confidence": payload["confidence"],
                "pillars": payload["pillars"],
                "forecast_6m": {
                    k: h6[k] for k in ("pulse_pred", "pulse_p10", "pulse_p90")
                }
                if h6
                else None,
            }
        )
    summary = {
        **metadata(work_dir),
        "last_month": scored["month"].max().strftime("%Y-%m"),
        "companies": summary_rows,
    }
    (web / "summary.json").write_text(json.dumps(summary, ensure_ascii=False))
    if mirror_dir is not None:
        shutil.rmtree(mirror_dir, ignore_errors=True)
        shutil.copytree(web, mirror_dir)
    return web


if __name__ == "__main__":
    from ml_service.pulse.config import ML_ROOT, WORK_DIR

    out = write_all(WORK_DIR, ML_ROOT.parent / "frontend" / "src" / "data" / "pulse")
    print(f"wrote {out}")
