"""Command line entry point for the X-Ray engine.

Usage::

    uv run python -m ml_service.xray.cli build-panel
    uv run python -m ml_service.xray.cli train [--no-cv]
    uv run python -m ml_service.xray.cli score --raw-dir DIR --out-json F --out-csv F
    uv run python -m ml_service.xray.cli evaluate
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import polars as pl

from ml_service.xray.config import FEATURES_DIR, MODELS_DIR, OUTPUT_DIR, RAW_DIR
from ml_service.xray.evaluate import evaluate_all, format_markdown
from ml_service.xray.export import export_json, export_submission
from ml_service.xray.features.panel import build_panel
from ml_service.xray.io import Dataset
from ml_service.xray.score.pipeline import ScoreEngine

PANEL_PATH = FEATURES_DIR / "panel.parquet"


def cmd_build_panel(args: argparse.Namespace) -> None:
    """Build the company x month feature panel from a raw CSV folder."""
    panel = build_panel(Dataset(args.raw_dir, cache_dir=args.cache_dir))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    panel.write_parquet(args.out)
    print(f"panel: {panel.height} rows x {panel.width} cols -> {args.out}")


def cmd_train(args: argparse.Namespace) -> None:
    """Fit the engine on a panel, persist it and write scored/OOF artefacts."""
    panel = pl.read_parquet(args.panel)
    engine = ScoreEngine.fit(panel, cross_validate=not args.no_cv)
    engine.save(args.models)
    scored = engine.score(panel)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    scored.write_parquet(OUTPUT_DIR / "scored_panel.parquet")
    if engine.models.oof is not None:
        engine.models.oof.write_parquet(OUTPUT_DIR / "oof.parquet")
    print(f"trained on {panel.height} rows; artefacts in {args.models}")


def cmd_score(args: argparse.Namespace) -> None:
    """Score an unseen dataset folder with the persisted engine."""
    ds = Dataset(args.raw_dir, cache_dir=args.cache_dir)
    panel = build_panel(ds)
    engine = ScoreEngine.load(args.models)
    scored = engine.score(panel)
    args.out_csv.parent.mkdir(parents=True, exist_ok=True)
    args.out_json.parent.mkdir(parents=True, exist_ok=True)
    export_submission(scored, args.out_csv)
    if not args.no_explain:
        from ml_service.xray.explain import explain_rows

        scored = explain_rows(engine, scored)
    export_json(scored, args.out_json)
    print(
        f"scored {scored['company_id'].n_unique()} companies, {scored.height} rows "
        f"-> {args.out_csv}, {args.out_json}"
    )


def cmd_evaluate(args: argparse.Namespace) -> None:
    """Evaluate the engine and print the markdown summary."""
    report = evaluate_all(panel_path=args.panel, out_path=args.out)
    print(format_markdown(report))
    print(f"\nreport -> {args.out}")


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser for every X-Ray command."""
    parser = argparse.ArgumentParser(prog="ml_service.xray.cli", description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    panel = sub.add_parser("build-panel", help="build the monthly feature panel")
    panel.add_argument("--raw-dir", type=Path, default=RAW_DIR)
    panel.add_argument("--cache-dir", type=Path, default=None)
    panel.add_argument("--out", type=Path, default=PANEL_PATH)
    panel.set_defaults(func=cmd_build_panel)

    train = sub.add_parser("train", help="fit and persist the score engine")
    train.add_argument("--panel", type=Path, default=PANEL_PATH)
    train.add_argument("--models", type=Path, default=MODELS_DIR)
    train.add_argument(
        "--no-cv", action="store_true", help="skip group-wise cross-validation"
    )
    train.set_defaults(func=cmd_train)

    score = sub.add_parser("score", help="score an unseen raw folder (hidden test set)")
    score.add_argument("--raw-dir", type=Path, required=True)
    score.add_argument("--cache-dir", type=Path, default=None)
    score.add_argument("--models", type=Path, default=MODELS_DIR)
    score.add_argument("--out-json", type=Path, default=OUTPUT_DIR / "xray_export.json")
    score.add_argument("--out-csv", type=Path, default=OUTPUT_DIR / "submission.csv")
    score.add_argument(
        "--no-explain", action="store_true", help="skip SHAP reasons in the JSON export"
    )
    score.set_defaults(func=cmd_score)

    evaluate = sub.add_parser(
        "evaluate", help="group CV + temporal backtest + stability"
    )
    evaluate.add_argument("--panel", type=Path, default=PANEL_PATH)
    evaluate.add_argument("--out", type=Path, default=OUTPUT_DIR / "evaluation.json")
    evaluate.set_defaults(func=cmd_evaluate)
    return parser


def main(argv: list[str] | None = None) -> int:
    """Parse ``argv`` and run the selected command."""
    args = build_parser().parse_args(argv)
    try:
        args.func(args)
    except KeyboardInterrupt:
        print("interrupted", file=sys.stderr)
        return 130
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
