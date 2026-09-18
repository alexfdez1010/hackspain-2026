"""Runnable export: explanations + alerts + anticipation -> JSON for the web demo.

Usage::

    uv run python -m ml_service.xray.run_export
"""

from __future__ import annotations

import shutil
import sys
import time
from pathlib import Path

import polars as pl

from ml_service.xray.anticipation import anticipation_report, save_report
from ml_service.xray.config import ML_ROOT, OUTPUT_DIR
from ml_service.xray.explain import explain_rows
from ml_service.xray.export import (
    alert_records,
    build_payload,
    export_company_files,
    export_submission,
    write_payload,
)
from ml_service.xray.monitor import alert_counts, build_alerts
from ml_service.xray.score.pipeline import ScoreEngine
from ml_service.xray.score.scoring import final_scores
from ml_service.xray.score.targets import stress_flag

SCORED_PATH = OUTPUT_DIR / "scored_panel.parquet"
OOF_PATH = OUTPUT_DIR / "oof.parquet"
WEB_OUTPUT = OUTPUT_DIR / "web"
WEB_APP_DIR = ML_ROOT.parent / "frontend" / "src" / "data" / "xray"
LEGACY_WEB_JSON = ML_ROOT.parent / "frontend" / "src" / "data" / "xray.json"


def _log(message: str, started: float) -> None:
    print(f"[{time.monotonic() - started:6.1f}s] {message}", flush=True)


def _oof_scored(calibration: list[float] | None) -> pl.DataFrame | None:
    """Out-of-fold predictions turned into scores, for the unseen-company AUROC."""
    if not OOF_PATH.exists():
        return None
    return final_scores(pl.read_parquet(OOF_PATH), calibration)


def _copy_to_web(source: Path) -> None:
    """Mirror the split export into the Next.js app and drop the legacy blob."""
    if WEB_APP_DIR.exists():
        shutil.rmtree(WEB_APP_DIR)
    shutil.copytree(source, WEB_APP_DIR)
    if LEGACY_WEB_JSON.exists():
        LEGACY_WEB_JSON.unlink()


def main() -> int:
    """Run the full export end to end. Returns a process exit code."""
    started = time.monotonic()
    if not SCORED_PATH.exists():
        print(f"missing {SCORED_PATH}; run the scoring pipeline first", file=sys.stderr)
        return 1
    engine = ScoreEngine.load()
    scored = pl.read_parquet(SCORED_PATH).with_columns(
        stress_flag().alias("stress_now")
    )
    _log(f"loaded {scored.height} company-months", started)

    explained = explain_rows(engine, scored)
    _log("SHAP attributions ready", started)

    alerts = build_alerts(explained)
    counts = alert_counts(alerts)
    _log(f"{alerts.height} alerts: {counts}", started)

    report = anticipation_report(explained, alerts, _oof_scored(engine.calibration))
    save_report(report)
    _log(
        "anticipation: median lead "
        f"{report['lead_time']['median_lead_months']} months over "
        f"{report['lead_time']['n_events']} events",
        started,
    )

    payload = build_payload(
        explained,
        {
            "alerts": alert_records(alerts),
            "alert_counts": counts,
            "anticipation": report,
        },
    )
    write_payload(payload)
    export_submission(explained)
    export_company_files(payload, WEB_OUTPUT)
    _copy_to_web(WEB_OUTPUT)
    _log(f"export written to {WEB_OUTPUT} and {WEB_APP_DIR}", started)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
