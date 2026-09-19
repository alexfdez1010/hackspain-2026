"""CLI for PULSE Señales.

    uv run python -m ml_service.pulse.signals.cli fit   [--work-dir DIR]
    uv run python -m ml_service.pulse.signals.cli build [--work-dir DIR]
    uv run python -m ml_service.pulse.signals.cli show COMPANY_ID [--work-dir DIR]

``fit`` detects every episode in the scored panel, fits the persistence model,
measures the anticipation curve and writes ``signals_evaluation.json``.
``build`` scores every episode with the frozen model into ``signals.parquet``,
which ``export_web`` attaches to each company. Run ``export_web`` afterwards.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import polars as pl

from ml_service.pulse.config import WORK_DIR
from ml_service.pulse.signals.anticipation import anticipation_curve
from ml_service.pulse.signals.detect import detect_all
from ml_service.pulse.signals.export import (
    EVALUATION_FILE,
    SIGNALS_FILE,
    signals_by_company,
)
from ml_service.pulse.signals.model import PersistenceModel

MODEL_FILE = "models/signals.json"


def _scored(work_dir: Path) -> pl.DataFrame:
    return pl.read_parquet(work_dir / "scored_panel.parquet")


def fit(work_dir: Path) -> dict:
    """Fit the persistence model and publish the evaluation."""
    scored = _scored(work_dir)
    signals = detect_all(scored)
    model = PersistenceModel.fit(signals)
    model.save(work_dir / MODEL_FILE)
    tx = pl.read_parquet(work_dir / "clean_transactions.parquet")
    result = {
        "signals_detected": int(signals.height),
        "persistence": model.evaluation(),
        "anticipation": anticipation_curve(scored, tx),
    }
    (work_dir / EVALUATION_FILE).write_text(json.dumps(result, indent=1))
    for name, ev in result["persistence"].items():
        print(
            f"{name:4s} signals={ev['signals']:5d} persistent={ev['persistent_share']:.2f} "
            f"OOF AUROC={ev['oof_auroc']:.3f}"
        )
    for k, h in result["anticipation"]["horizons"].items():
        print(
            f"+{k}m rows={h['rows']:6d} base={h['base_rate']:.3f} AUROC={h['auroc']:.3f} "
            f"recall@{h['alert_share']:.0%}={h['recall']:.2f} lift={h['lift']}"
        )
    return result


def build(work_dir: Path) -> pl.DataFrame:
    """Score every episode with the frozen model and write ``signals.parquet``."""
    signals = PersistenceModel.load(work_dir / MODEL_FILE).score(
        detect_all(_scored(work_dir))
    )
    signals.write_parquet(work_dir / SIGNALS_FILE)
    open_now = signals.filter(pl.col("persistent").is_null())
    print(
        f"{signals.height:,} signals for {signals['company_id'].n_unique()} companies, "
        f"{open_now.height:,} still open -> {work_dir / SIGNALS_FILE}"
    )
    return signals


def show(work_dir: Path, company_id: str) -> None:
    """Print one company's signals as the web app receives them."""
    print(
        json.dumps(
            signals_by_company(work_dir).get(company_id, []),
            ensure_ascii=False,
            indent=1,
        )
    )


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="PULSE Señales")
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("fit", "build", "show"):
        p = sub.add_parser(name)
        p.add_argument("--work-dir", type=Path, default=WORK_DIR)
        if name == "show":
            p.add_argument("company_id")
    args = parser.parse_args(argv)
    if args.command == "fit":
        fit(args.work_dir)
    elif args.command == "build":
        build(args.work_dir)
    else:
        show(args.work_dir, args.company_id)


if __name__ == "__main__":
    main()
