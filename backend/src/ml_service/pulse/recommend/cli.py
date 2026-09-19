"""CLI: fit the risk model, build every recommendation, show one company.

uv run python -m ml_service.pulse.recommend.cli fit   [--work-dir DIR]
uv run python -m ml_service.pulse.recommend.cli build [--work-dir DIR] [--raw-dir DIR]
uv run python -m ml_service.pulse.recommend.cli show COMP_0001 [--work-dir DIR]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import polars as pl

from ml_service.pulse.clean.invoices import clean_invoices
from ml_service.pulse.clean.report import CleaningReport
from ml_service.pulse.config import RAW_DIR, WORK_DIR
from ml_service.pulse.evaluate import stress_label
from ml_service.pulse.load import load_raw
from ml_service.pulse.recommend.engine import Recommender
from ml_service.pulse.recommend.export import write_all
from ml_service.pulse.recommend.inputs import build_snapshots
from ml_service.pulse.recommend.inputs_raw import holdings_by_company, invoice_books
from ml_service.pulse.recommend.risk import RiskModel, feature_frame
from ml_service.pulse.recommend.snapshot import CompanySnapshot

MODEL_FILE = ("models", "risk_model.json")


def _with_d3(scored: pl.DataFrame) -> pl.DataFrame:
    return scored.sort("company_id", "month").with_columns(
        (pl.col("pulse") - pl.col("pulse").shift(3).over("company_id")).alias(
            "pulse_d3"
        )
    )


def fit(work_dir: Path) -> RiskModel:
    """Train the stress scorecard on every company-month with an observable future."""
    scored = pl.read_parquet(work_dir / "scored_panel.parquet")
    tx = pl.read_parquet(work_dir / "clean_transactions.parquet")
    df = stress_label(_with_d3(scored), tx).filter(
        pl.col("has_future") & pl.col("pulse").is_not_null()
    )
    x = feature_frame(df).to_numpy().astype(float)
    y = df["y_stress"].to_numpy().astype(int)
    groups = df["group_id"].fill_null("?").to_numpy()
    model = RiskModel().fit(x, y, groups)
    model.save(work_dir.joinpath(*MODEL_FILE))
    (work_dir / "risk_evaluation.json").write_text(
        json.dumps(model.evaluation, indent=1)
    )
    print(json.dumps(model.evaluation, indent=1))
    return model


def snapshots(work_dir: Path, raw_dir: Path) -> list[CompanySnapshot]:
    """Latest-month snapshots from the scored panel, forecast and raw products/invoices."""
    raw = load_raw(raw_dir, work_dir / "cache")
    books = invoice_books(clean_invoices(raw, CleaningReport()))
    holdings = holdings_by_company(raw.debt_products, raw.debt_schedule_config)
    scored = pl.read_parquet(work_dir / "scored_panel.parquet")
    forecast = pl.read_parquet(work_dir / "forecast.parquet")
    return build_snapshots(scored, forecast, holdings, books)


def build(work_dir: Path, raw_dir: Path) -> Path:
    model = RiskModel.load(work_dir.joinpath(*MODEL_FILE))
    snaps = snapshots(work_dir, raw_dir)
    out = write_all(
        Recommender(model), snaps, work_dir / "recommendations", model.evaluation
    )
    summary = json.loads((out / "summary.json").read_text())
    tops = [r["top_product"] or "ninguno" for r in summary["companies"]]
    counts = {str(k): int(v) for k, v in zip(*np.unique(tops, return_counts=True))}
    print(f"wrote {len(tops)} recommendations to {out}; top product mix: {counts}")
    return out


def show(work_dir: Path, company_id: str) -> None:
    path = work_dir / "recommendations" / "companies" / f"{company_id}.json"
    payload = json.loads(path.read_text())
    print(payload["summary"])
    for offer in payload["recommendations"]:
        print(f"\n#{offer['rank']} {offer['headline']} (encaje {offer['fit']:.0f}/100)")
        for line in offer["why"]:
            print(f"  - {line}")
        print("  Precio:")
        for line in offer["pricing"]["story"]:
            print(f"    · {line}")
        for line in offer["lever_story"]:
            print(f"  ↑ {line}")
    print("\nDescartados:")
    for d in payload["declined"]:
        print(f"  {d['label']}: {d['reasons'][0]}")
    plan = payload["improvement_plan"]
    if plan["unlocks"] or plan["story"]:
        print("\nPlan de mejora:")
        for line in plan["unlocks"] + plan["story"]:
            print(f"  → {line}")


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description="PULSE Advisor: product recommendations"
    )
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("fit", "build", "show"):
        p = sub.add_parser(name)
        p.add_argument("--work-dir", type=Path, default=WORK_DIR)
        if name == "build":
            p.add_argument("--raw-dir", type=Path, default=RAW_DIR)
        if name == "show":
            p.add_argument("company_id")
    args = parser.parse_args(argv)
    if args.command == "fit":
        fit(args.work_dir)
    elif args.command == "build":
        build(args.work_dir, args.raw_dir)
    else:
        show(args.work_dir, args.company_id)


if __name__ == "__main__":
    main()
