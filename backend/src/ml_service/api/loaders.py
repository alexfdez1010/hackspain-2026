"""Filesystem loaders that turn engine artefacts into plain API payloads.

Every loader is defensive: missing artefacts degrade a feature instead of
breaking start-up, and modules written by other agents (``monitor``) are
imported lazily so the API boots before they land.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any

MODEL_FILES = ("normalizer.json", "calibration.json")


def read_json(path: Path) -> Any | None:
    """Read a JSON file, returning ``None`` when absent or malformed."""
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return None


def models_present(models_dir: Path) -> bool:
    """True when the persisted scoring artefacts are on disk."""
    return all((models_dir / name).exists() for name in MODEL_FILES)


def load_web_records(web_dir: Path) -> list[dict]:
    """Load ``data/output/web/companies/*.json`` written by the export step."""
    folder = web_dir / "companies"
    if not folder.is_dir():
        return []
    records: list[dict] = []
    for path in sorted(folder.glob("*.json")):
        record = read_json(path)
        if isinstance(record, dict):
            record.setdefault("company_id", path.stem)
            records.append(record)
    return records


def load_scored_frame(scored_path: Path):
    """Read the scored panel parquet, or ``None`` when it is missing."""
    if not scored_path.exists():
        return None
    import polars as pl

    return pl.read_parquet(scored_path)


def load_parquet_records(scored_path: Path) -> list[dict]:
    """Build company records straight from ``scored_panel.parquet``."""
    frame = load_scored_frame(scored_path)
    if frame is None:
        return []
    from ml_service.xray.export import company_records

    return company_records(frame)


def _as_dicts(alerts: Any) -> list[dict]:
    """Normalise a polars frame or iterable of alerts into JSON-ready dicts."""
    rows = alerts.to_dicts() if hasattr(alerts, "to_dicts") else list(alerts or [])
    out: list[dict] = []
    for row in rows:
        item = dict(row)
        month = item.get("month")
        if isinstance(month, datetime):
            item["month"] = month.strftime("%Y-%m")
        out.append(item)
    return out


def build_alerts_from_frame(scored_path: Path) -> list[dict]:
    """Run the monitoring rules over the scored panel when available."""
    try:
        from ml_service.xray.monitor import build_alerts
    except ImportError:
        return []
    frame = load_scored_frame(scored_path)
    if frame is None:
        return []
    try:
        return _as_dicts(build_alerts(frame))
    except Exception:  # noqa: BLE001 - a broken rule must not break the API
        return []


def load_alerts(web_dir: Path, summary: dict, scored_path: Path) -> list[dict]:
    """Alerts from the precomputed export, falling back to live computation."""
    from_summary = summary.get("alerts")
    if isinstance(from_summary, list) and from_summary:
        return _as_dicts(from_summary)
    from_file = read_json(web_dir / "alerts.json")
    if isinstance(from_file, list) and from_file:
        return _as_dicts(from_file)
    if isinstance(from_file, dict) and isinstance(from_file.get("alerts"), list):
        return _as_dicts(from_file["alerts"])
    return build_alerts_from_frame(scored_path)


def load_submission_csv(output_dir: Path) -> str | None:
    """Return the training-set submission CSV, regenerating it if needed."""
    path = output_dir / "submission.csv"
    if path.exists():
        return path.read_text()
    frame = load_scored_frame(output_dir / "scored_panel.parquet")
    if frame is None:
        return None
    from ml_service.xray.export import export_submission

    output_dir.mkdir(parents=True, exist_ok=True)
    return export_submission(frame, path).read_text()
