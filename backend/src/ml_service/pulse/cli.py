"""CLI: build the cleaned panel, fit the PULSE engine, score a raw folder.

uv run python -m ml_service.pulse.cli build  [--raw-dir DIR] [--work-dir DIR]
uv run python -m ml_service.pulse.cli fit    [--work-dir DIR]
uv run python -m ml_service.pulse.cli score  --raw-dir DIR [--work-dir DIR] [--out FILE]
uv run python -m ml_service.pulse.cli evaluate [--work-dir DIR]
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import polars as pl

from ml_service.pulse.clean.pipeline import clean_all
from ml_service.pulse.config import RAW_DIR, WORK_DIR
from ml_service.pulse.engine import PulseEngine
from ml_service.pulse.evaluate import run as run_evaluation
from ml_service.pulse.load import load_raw
from ml_service.pulse.panel import build_panel
from ml_service.pulse.variables import VARIABLES

OUTPUT_COLUMNS = [
    "company_id",
    "group_id",
    "month",
    "months_observed",
    "pulse",
    "pulse_raw",
    "confidence",
]


def build(raw_dir: Path, work_dir: Path) -> pl.DataFrame:
    """Raw CSVs -> cleaned inputs -> panel.parquet + cleaning_report.{json,md}."""
    raw = load_raw(raw_dir, work_dir / "cache")
    clean = clean_all(raw)
    panel = build_panel(clean)
    work_dir.mkdir(parents=True, exist_ok=True)
    panel.write_parquet(work_dir / "panel.parquet")
    clean.transactions.write_parquet(work_dir / "clean_transactions.parquet")
    clean.report.save(work_dir / "cleaning_report.json")
    print(
        f"panel: {panel.shape[0]:,} company-months, {panel['company_id'].n_unique()} companies"
    )
    return panel


def fit(work_dir: Path) -> PulseEngine:
    panel = pl.read_parquet(work_dir / "panel.parquet")
    engine = PulseEngine.fit(panel)
    engine.save(work_dir / "models")
    scored = engine.score(panel)
    scored.write_parquet(work_dir / "scored_panel.parquet")
    print(scored.select("pulse", "pulse_raw", "confidence").describe())
    return engine


def score(raw_dir: Path, work_dir: Path, out: Path) -> pl.DataFrame:
    """Score an unseen folder with the frozen engine (needs only that folder + models/)."""
    raw = load_raw(raw_dir, work_dir / "cache" / raw_dir.name)
    panel = build_panel(clean_all(raw))
    scored = PulseEngine.load(work_dir / "models").score(panel)
    cols = (
        OUTPUT_COLUMNS
        + [f"var_{v.key}" for v in VARIABLES]
        + [f"pillar_{p}" for p in ("liquidez", "deuda", "pago", "cobro")]
    )
    scored.select(cols).with_columns(pl.col("month").dt.strftime("%Y-%m")).write_csv(
        out
    )
    print(f"scored {scored.shape[0]:,} rows -> {out}")
    return scored


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="PULSE company health score")
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("build", "fit", "score", "evaluate"):
        p = sub.add_parser(name)
        p.add_argument("--work-dir", type=Path, default=WORK_DIR)
        if name in ("build", "score"):
            p.add_argument("--raw-dir", type=Path, default=RAW_DIR)
        if name == "score":
            p.add_argument("--out", type=Path, default=WORK_DIR / "pulse_scores.csv")
    args = parser.parse_args(argv)
    try:
        if args.command == "build":
            build(args.raw_dir, args.work_dir)
        elif args.command == "fit":
            fit(args.work_dir)
        elif args.command == "evaluate":
            print(json.dumps(run_evaluation(args.work_dir), indent=1))
        else:
            score(args.raw_dir, args.work_dir, args.out)
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise


if __name__ == "__main__":
    main()
