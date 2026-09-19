"""Export the detail behind every PULSE variable: one JSON per company for the web app.

Writes ``<work_dir>/web/details/<company_id>.json`` for every company already
exported by :mod:`ml_service.pulse.export_web` and optionally mirrors the folder
into the frontend's bundled data. Run it after ``export_web``: the company list
comes from ``web/companies/``.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import polars as pl

from ml_service.pulse.clean.pipeline import clean_all
from ml_service.pulse.details.build import build_payloads
from ml_service.pulse.load import load_raw

DETAILS = "details"


def exported_companies(web: Path) -> list[str] | None:
    """Company ids already written by ``export_web``, or None when it has not run."""
    companies = web / "companies"
    if not companies.is_dir():
        return None
    return sorted(p.stem for p in companies.glob("*.json"))


def write_all(work_dir: Path, raw_dir: Path, mirror_dir: Path | None = None) -> Path:
    """Rebuild the cleaned frames, build every detail payload and write the folder."""
    raw = load_raw(raw_dir, work_dir / "cache")
    clean = clean_all(raw)
    scored = pl.read_parquet(work_dir / "scored_panel.parquet").filter(
        pl.col("pulse").is_not_null()
    )
    web = work_dir / "web"
    payloads = build_payloads(clean, raw, scored, exported_companies(web))
    out = web / DETAILS
    shutil.rmtree(out, ignore_errors=True)
    out.mkdir(parents=True)
    for company_id, payload in payloads.items():
        (out / f"{company_id}.json").write_text(json.dumps(payload, ensure_ascii=False))
    if mirror_dir is not None:
        mirror(web, mirror_dir)
    return out


def mirror(web: Path, mirror_dir: Path) -> Path:
    """Copy ``details/`` into the frontend data folder, leaving its siblings alone."""
    mirror_dir.mkdir(parents=True, exist_ok=True)
    shutil.rmtree(mirror_dir / DETAILS, ignore_errors=True)
    shutil.copytree(web / DETAILS, mirror_dir / DETAILS)
    return mirror_dir


if __name__ == "__main__":
    from ml_service.pulse.config import ML_ROOT, RAW_DIR, WORK_DIR

    folder = write_all(
        WORK_DIR, RAW_DIR, ML_ROOT.parent / "frontend" / "src" / "data" / "pulse"
    )
    print(f"wrote {folder}")
