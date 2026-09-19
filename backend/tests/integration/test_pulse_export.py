"""Integration test: rebuild the JSON export of the real training run into a temp folder.

Skipped when the hackathon dataset or a previous `uv run pulse` is not on disk,
so the suite still passes on a clean checkout.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from ml_service.pulse.config import RAW_DIR, WORK_DIR
from ml_service.pulse.forecast.config import HORIZONS
from ml_service.pulse.run.cli import run
from ml_service.pulse.run.options import resolve_options
from ml_service.pulse.variables import VARIABLES

pytestmark = pytest.mark.skipif(
    not (RAW_DIR / "companies.csv").exists()
    or not (WORK_DIR / "scored_panel.parquet").exists()
    or not (WORK_DIR / "recommendations" / "catalogue.json").exists(),
    reason="needs data/raw/xray and a finished `uv run pulse`",
)


def test_export_only_run_writes_a_complete_folder(tmp_path: Path):
    out = run(resolve_options(out_dir=tmp_path / "export", export_only=True))
    summary = json.loads((out / "summary.json").read_text())
    companies = summary["companies"]
    assert len(companies) > 1000
    assert [v["key"] for v in summary["variables"]] == [v.key for v in VARIABLES]
    assert sum(v["weight"] for v in summary["variables"]) == 100
    assert summary["evaluation"]["score"]["auroc"] > 0.5
    first = companies[0]["company_id"]
    company = json.loads((out / "companies" / f"{first}.json").read_text())
    assert [f["horizon"] for f in company["forecast"]] == list(HORIZONS)
    details = json.loads((out / "details" / f"{first}.json").read_text())
    assert set(details["variables"]) == {v.key for v in VARIABLES}
    reco = json.loads(
        (out / "recommendations" / "companies" / f"{first}.json").read_text()
    )
    assert reco["company_id"] == first and "recommendations" in reco
    catalogue = json.loads((out / "recommendations" / "catalogue.json").read_text())
    assert len(catalogue["products"]) == 7
    manifest = json.loads((out / "manifest.json").read_text())
    assert manifest["files"]["companies"] == len(companies)
    assert manifest["files"]["details"] == len(companies)
