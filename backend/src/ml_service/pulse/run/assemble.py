"""Assemble the output folder: the JSON files the web app bundles, plus the reports."""

from __future__ import annotations

import json
import shutil
from datetime import UTC, datetime
from pathlib import Path

from ml_service.pulse import export_details, export_web
from ml_service.pulse.recommend import export as advisor_export
from ml_service.pulse.run.options import RunOptions

REPORTS_DIR = "reports"
MANIFEST_FILE = "manifest.json"
REPORT_FILES = (
    "cleaning_report.json",
    "cleaning_report.md",
    "evaluation.json",
    "forecast_evaluation.json",
    "risk_evaluation.json",
    "signals_evaluation.json",
)


def _count(folder: Path) -> int:
    return len(list(folder.glob("*.json"))) if folder.is_dir() else 0


def copy_reports(work_dir: Path, out_dir: Path) -> list[str]:
    """Copy the cleaning and evaluation reports that exist into ``<out>/reports``."""
    target = out_dir / REPORTS_DIR
    shutil.rmtree(target, ignore_errors=True)
    target.mkdir(parents=True)
    copied = []
    for name in REPORT_FILES:
        source = work_dir / name
        if source.exists():
            shutil.copy(source, target / name)
            copied.append(name)
    return copied


def manifest(opts: RunOptions, out_dir: Path, reports: list[str]) -> dict:
    """Describe what the folder holds: source dataset, mode, counts and last month."""
    summary_path = out_dir / "summary.json"
    summary = json.loads(summary_path.read_text()) if summary_path.exists() else {}
    return {
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "mode": opts.mode,
        "raw_dir": str(opts.raw_dir),
        "work_dir": str(opts.work_dir),
        "last_month": summary.get("last_month"),
        "companies": len(summary.get("companies", [])),
        "files": {
            "companies": _count(out_dir / "companies"),
            "details": _count(out_dir / "details"),
            "recommendations": _count(out_dir / "recommendations" / "companies"),
        },
        "reports": reports,
    }


def assemble(opts: RunOptions) -> Path:
    """Copy the web export and the Advisor export into ``opts.out_dir``.

    Layout (what ``frontend/src/data/pulse`` expects)::

        <out>/summary.json
        <out>/companies/<company_id>.json
        <out>/details/<company_id>.json
        <out>/recommendations/catalogue.json
        <out>/recommendations/companies/<company_id>.json
        <out>/reports/*.json|md
        <out>/manifest.json
    """
    web = opts.work_dir / "web"
    reco = opts.work_dir / "recommendations"
    for required in (web / "summary.json", reco / advisor_export.CATALOGUE_FILE):
        if not required.exists():
            raise FileNotFoundError(f"{required} missing; the pipeline did not finish")
    out = opts.out_dir
    out.mkdir(parents=True, exist_ok=True)
    export_web.mirror(web, out)
    export_details.mirror(web, out)
    advisor_export.mirror(reco, out / "recommendations")
    reports = copy_reports(opts.work_dir, out)
    (out / MANIFEST_FILE).write_text(
        json.dumps(manifest(opts, out, reports), indent=1, ensure_ascii=False)
    )
    return out
