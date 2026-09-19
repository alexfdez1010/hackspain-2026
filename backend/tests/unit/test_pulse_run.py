"""Unit tests for the `pulse` command: option defaults and output-folder assembly."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from ml_service.pulse.config import RAW_DIR, WORK_DIR
from ml_service.pulse.run import assemble as asm
from ml_service.pulse.run import steps
from ml_service.pulse.run.cli import build_parser
from ml_service.pulse.run.options import (
    EXPORT_DIR,
    MODELS_DIR,
    RUNS_DIR,
    RunOptions,
    resolve_options,
)


def test_defaults_train_in_the_work_dir_and_export_next_to_it():
    opts = resolve_options()
    assert opts.raw_dir == RAW_DIR.resolve()
    assert opts.work_dir == WORK_DIR
    assert opts.out_dir == (WORK_DIR / EXPORT_DIR).resolve()
    assert opts.models_dir == (WORK_DIR / MODELS_DIR).resolve()
    assert opts.mode == "train" and opts.evaluate


def test_frozen_run_of_another_dataset_gets_its_own_work_dir(tmp_path: Path):
    hidden = tmp_path / "hidden_test"
    opts = resolve_options(raw_dir=hidden, frozen=True)
    assert opts.work_dir == WORK_DIR / RUNS_DIR / "hidden_test"
    assert opts.out_dir == (opts.work_dir / EXPORT_DIR).resolve()
    assert opts.mode == "frozen"


def test_explicit_paths_win_and_export_only_is_reported(tmp_path: Path):
    opts = resolve_options(
        raw_dir=tmp_path / "raw",
        work_dir=tmp_path / "work",
        out_dir=tmp_path / "out",
        models_dir=tmp_path / "models",
        export_only=True,
    )
    assert (opts.work_dir, opts.out_dir) == (
        (tmp_path / "work").resolve(),
        (tmp_path / "out").resolve(),
    )
    assert opts.mode == "export-only"


def test_parser_maps_flags_to_options():
    args = build_parser().parse_args(
        ["--raw-dir", "x", "--out", "y", "--frozen", "--no-evaluate"]
    )
    assert (args.raw_dir, args.out, args.frozen, args.no_evaluate) == (
        Path("x"),
        Path("y"),
        True,
        True,
    )


def _fake_run(work: Path) -> None:
    """The artefacts a finished run leaves under the work dir, in miniature."""
    web = work / "web"
    (web / "companies").mkdir(parents=True)
    (web / "details").mkdir()
    (web / "summary.json").write_text(
        json.dumps({"last_month": "2026-08", "companies": [{"company_id": "C1"}]})
    )
    (web / "companies" / "C1.json").write_text("{}")
    (web / "details" / "C1.json").write_text("{}")
    reco = work / "recommendations"
    (reco / "companies").mkdir(parents=True)
    (reco / "catalogue.json").write_text("{}")
    (reco / "summary.json").write_text("{}")
    (reco / "snapshots.json").write_text("[]")
    (reco / "companies" / "C1.json").write_text("{}")
    (work / "evaluation.json").write_text("{}")
    (work / "cleaning_report.md").write_text("| table |")


def test_assemble_copies_exactly_what_the_web_app_bundles(tmp_path: Path):
    work, out = tmp_path / "work", tmp_path / "out"
    _fake_run(work)
    opts = RunOptions(tmp_path / "raw", work, out, work / MODELS_DIR)
    assert asm.assemble(opts) == out
    assert sorted(p.name for p in out.iterdir()) == [
        "companies",
        "details",
        "manifest.json",
        "recommendations",
        "reports",
        "summary.json",
    ]
    assert sorted(p.name for p in (out / "recommendations").iterdir()) == [
        "catalogue.json",
        "companies",
    ]
    assert not (out / "recommendations" / "snapshots.json").exists()
    manifest = json.loads((out / "manifest.json").read_text())
    assert manifest["mode"] == "train" and manifest["last_month"] == "2026-08"
    assert manifest["companies"] == 1
    assert manifest["files"] == {"companies": 1, "details": 1, "recommendations": 1}
    assert manifest["reports"] == ["cleaning_report.md", "evaluation.json"]


def test_assemble_refuses_an_unfinished_run(tmp_path: Path):
    opts = RunOptions(tmp_path, tmp_path / "work", tmp_path / "out", tmp_path)
    with pytest.raises(FileNotFoundError):
        asm.assemble(opts)


def test_frozen_run_copies_models_and_reports(tmp_path: Path):
    source = tmp_path / "train"
    (source / MODELS_DIR / "forecast").mkdir(parents=True)
    (source / MODELS_DIR / "normalizer.json").write_text("{}")
    (source / MODELS_DIR / "forecast" / "model.txt").write_text("tree")
    (source / "evaluation.json").write_text('{"auroc_pulse": 0.8}')
    work = tmp_path / "runs" / "hidden"
    work.mkdir(parents=True)
    opts = RunOptions(tmp_path, work, work / EXPORT_DIR, source / MODELS_DIR, True)
    steps.prepare_frozen(opts)
    assert (work / MODELS_DIR / "forecast" / "model.txt").read_text() == "tree"
    assert json.loads((work / "evaluation.json").read_text())["auroc_pulse"] == 0.8
    with pytest.raises(FileNotFoundError):
        steps.prepare_frozen(
            RunOptions(tmp_path, work, work, tmp_path / "nowhere", True)
        )
