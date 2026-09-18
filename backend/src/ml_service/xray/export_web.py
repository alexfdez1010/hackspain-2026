"""Split the export payload into the per-page files the web app fetches."""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

# The index page only needs the sentences; the waterfalls live in the company file.
SUMMARY_EXPLANATION_KEYS = (
    "month",
    "score",
    "score_prev",
    "score_ref",
    "reference_month",
    "window_months",
    "narrative_es",
    "narrative_1m_es",
    "regime_text_es",
)


def summary_record(record: dict[str, Any]) -> dict[str, Any]:
    """Company record for the index: no monthly series, narratives without waterfalls."""
    light = {k: v for k, v in record.items() if k != "series"}
    explanation = light.get("explanation") or {}
    light["explanation"] = {k: explanation.get(k) for k in SUMMARY_EXPLANATION_KEYS}
    return light


def export_company_files(payload: dict[str, Any], folder: Path) -> Path:
    """Write ``summary.json`` plus one ``companies/<company_id>.json`` per company.

    ``summary.json`` carries every company *without* its monthly ``series``
    (plus alerts, anticipation, labels and the narrative sentences);
    ``companies/<company_id>.json`` holds one full record each, so the web app
    loads only what it renders.

    Args:
        payload: Output of :func:`ml_service.xray.export.build_payload`.
        folder: Destination directory; its ``companies`` subfolder is rebuilt.

    Returns:
        The destination folder.
    """
    companies = payload.get("companies", [])
    company_dir = folder / "companies"
    if company_dir.exists():
        shutil.rmtree(company_dir)
    company_dir.mkdir(parents=True, exist_ok=True)
    for record in companies:
        target = company_dir / f"{record['company_id']}.json"
        target.write_text(json.dumps(record, ensure_ascii=False))
    summary = dict(payload)
    summary["companies"] = [summary_record(r) for r in companies]
    (folder / "summary.json").write_text(json.dumps(summary, ensure_ascii=False))
    return folder
