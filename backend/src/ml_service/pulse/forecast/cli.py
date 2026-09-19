"""CLI for the forecast layer.

    uv run python -m ml_service.pulse.forecast.cli fit      [--work-dir DIR]
    uv run python -m ml_service.pulse.forecast.cli evaluate [--work-dir DIR]
    uv run python -m ml_service.pulse.forecast.cli predict  [--raw-dir DIR] [--work-dir DIR] [--out FILE] [--all-months]

``fit``/``evaluate`` use the training panel already built by ``ml_service.pulse.cli build|fit``.
``predict`` without ``--raw-dir`` forecasts the training portfolio; with it, an unseen folder
is cleaned, scored with the frozen PULSE engine and forecast with the frozen model.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import polars as pl

from ml_service.pulse.clean.pipeline import clean_all
from ml_service.pulse.config import RAW_DIR, WORK_DIR
from ml_service.pulse.engine import PulseEngine
from ml_service.pulse.forecast.engine import ForecastEngine
from ml_service.pulse.forecast.evaluate import evaluate
from ml_service.pulse.forecast.features import forecast_frame
from ml_service.pulse.load import load_raw
from ml_service.pulse.panel import build_panel

FORECAST_MODELS = "models/forecast"


def _frame(raw_dir: Path, work_dir: Path, cache_name: str) -> pl.DataFrame:
    raw = load_raw(raw_dir, work_dir / "cache" / cache_name)
    clean = clean_all(raw)
    scored = PulseEngine.load(work_dir / "models").score(build_panel(clean))
    return forecast_frame(scored, clean)


def fit(work_dir: Path) -> None:
    frame = _frame(RAW_DIR, work_dir, "")
    frame.write_parquet(work_dir / "forecast_frame.parquet")
    engine = ForecastEngine.fit(frame)
    engine.save(work_dir / FORECAST_MODELS)
    band = ", ".join(
        f"+{h}: [{lo:+.1f}, {hi:+.1f}]" for h, (lo, hi) in engine.model.band.items()
    )
    print(
        f"fitted one model for horizons +1..+{max(engine.model.band)} on "
        f"{frame.shape[0]:,} company-months; p10-p90 band offsets {band}"
    )


def run_evaluate(work_dir: Path) -> None:
    frame = pl.read_parquet(work_dir / "forecast_frame.parquet")
    result = evaluate(frame)
    (work_dir / "forecast_evaluation.json").write_text(json.dumps(result, indent=1))
    o = result["overall"]
    print(
        f"all  n={o['n']:6d} MAE persist {o['mae_persist']:5.2f} reversion {o['mae_reversion']:5.2f} "
        f"ML {o['mae_ml']:5.2f} ({o['gain_vs_persist_pct']:+.1f}% / {o['gain_vs_reversion_pct']:+.1f}%) "
        f"band {o['band_p10_p90_coverage']}"
    )
    for h, r in result["horizons"].items():
        print(
            f"+{h:>2}m n={r['n']:6d} MAE persist {r['mae_persist']:5.2f} reversion {r['mae_reversion']:5.2f} "
            f"ML {r['mae_ml']:5.2f} ({r['gain_vs_persist_pct']:+.1f}% / {r['gain_vs_reversion_pct']:+.1f}%) "
            f"dir {r['direction_accuracy_big_moves']} decl {r['recall_declines']} impr {r['recall_improvements']} "
            f"band {r['band_p10_p90_coverage']}"
        )


def predict(raw_dir: Path | None, work_dir: Path, out: Path, all_months: bool) -> None:
    if raw_dir is None:
        frame = pl.read_parquet(work_dir / "forecast_frame.parquet")
    else:
        frame = _frame(raw_dir, work_dir, raw_dir.name)
    engine = ForecastEngine.load(work_dir / FORECAST_MODELS)
    forecast = engine.predict(frame, latest_only=not all_months)
    forecast.write_parquet(out.with_suffix(".parquet"))
    forecast.with_columns(
        pl.col("month", "target_month").dt.strftime("%Y-%m")
    ).write_csv(out.with_suffix(".csv"))
    print(
        f"{forecast.shape[0]:,} forecast rows for {forecast['company_id'].n_unique()} companies -> {out.with_suffix('.csv')}"
    )


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="PULSE forecasts")
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("fit", "evaluate", "predict"):
        p = sub.add_parser(name)
        p.add_argument("--work-dir", type=Path, default=WORK_DIR)
        if name == "predict":
            p.add_argument("--raw-dir", type=Path, default=None)
            p.add_argument("--out", type=Path, default=WORK_DIR / "forecast")
            p.add_argument("--all-months", action="store_true")
    args = parser.parse_args(argv)
    if args.command == "fit":
        fit(args.work_dir)
    elif args.command == "evaluate":
        run_evaluate(args.work_dir)
    else:
        predict(args.raw_dir, args.work_dir, args.out, args.all_months)


if __name__ == "__main__":
    main()
