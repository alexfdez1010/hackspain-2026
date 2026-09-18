"""Unit tests for the X-Ray command line interface (parsing only)."""

from __future__ import annotations

from pathlib import Path

import pytest

from ml_service.xray import cli
from ml_service.xray.config import FEATURES_DIR, MODELS_DIR, OUTPUT_DIR, RAW_DIR


def _parse(argv: list[str]):
    return cli.build_parser().parse_args(argv)


def test_build_panel_defaults_to_the_training_folder():
    """Without arguments the panel is built from the configured raw folder."""
    args = _parse(["build-panel"])
    assert args.func is cli.cmd_build_panel
    assert args.raw_dir == RAW_DIR
    assert args.out == FEATURES_DIR / "panel.parquet"
    assert args.cache_dir is None


def test_build_panel_accepts_overrides():
    """Raw folder and output file can be redirected."""
    args = _parse(["build-panel", "--raw-dir", "/tmp/raw", "--out", "/tmp/p.parquet"])
    assert args.raw_dir == Path("/tmp/raw")
    assert args.out == Path("/tmp/p.parquet")


def test_train_cross_validates_unless_disabled():
    """Cross-validation is on by default and can be switched off."""
    assert _parse(["train"]).no_cv is False
    assert _parse(["train", "--no-cv"]).no_cv is True
    assert _parse(["train"]).models == MODELS_DIR


def test_score_requires_a_raw_folder():
    """The hidden-test command refuses to run without a dataset folder."""
    with pytest.raises(SystemExit):
        _parse(["score"])


def test_score_wires_both_outputs():
    """Submission CSV and export JSON are both addressable."""
    args = _parse(
        [
            "score",
            "--raw-dir",
            "/tmp/hidden",
            "--out-json",
            "/tmp/x.json",
            "--out-csv",
            "/tmp/x.csv",
        ]
    )
    assert args.func is cli.cmd_score
    assert args.raw_dir == Path("/tmp/hidden")
    assert args.out_json == Path("/tmp/x.json")
    assert args.out_csv == Path("/tmp/x.csv")
    assert args.models == MODELS_DIR


def test_score_defaults_do_not_depend_on_training_data():
    """Defaults point at the persisted engine and the shared output folder."""
    args = _parse(["score", "--raw-dir", "/tmp/hidden"])
    assert args.out_json == OUTPUT_DIR / "xray_export.json"
    assert args.out_csv == OUTPUT_DIR / "submission.csv"


def test_evaluate_defaults():
    """Evaluation reads the cached panel and writes evaluation.json."""
    args = _parse(["evaluate"])
    assert args.func is cli.cmd_evaluate
    assert args.out == OUTPUT_DIR / "evaluation.json"


def test_unknown_command_exits():
    """An unknown or missing subcommand is a usage error."""
    with pytest.raises(SystemExit):
        _parse([])
    with pytest.raises(SystemExit):
        _parse(["nope"])


def test_main_dispatches_to_the_selected_command(monkeypatch):
    """``main`` runs the function the parser attached to the namespace."""
    seen: dict[str, Path] = {}
    parser = cli.build_parser()
    args = parser.parse_args(["evaluate", "--out", "/tmp/e.json"])
    args.func = lambda parsed: seen.update(out=parsed.out)
    monkeypatch.setattr(parser, "parse_args", lambda _argv: args)
    monkeypatch.setattr(cli, "build_parser", lambda: parser)
    assert cli.main(["evaluate"]) == 0
    assert seen == {"out": Path("/tmp/e.json")}


def test_main_returns_130_on_interrupt(monkeypatch):
    """A Ctrl-C during a command is reported as the conventional exit code."""

    def boom(_args):
        raise KeyboardInterrupt

    parser = cli.build_parser()
    monkeypatch.setattr(cli, "build_parser", lambda: parser)
    args = parser.parse_args(["evaluate"])
    args.func = boom
    monkeypatch.setattr(parser, "parse_args", lambda _argv: args)
    assert cli.main(["evaluate"]) == 130
