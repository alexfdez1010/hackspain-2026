"""The steps of the pipeline, in order. Each one writes its artefacts under the work dir.

The raw tables are loaded and cleaned once (``build``) and shared by the steps
that need them again (forecast features, Advisor inputs, per-variable details).
"""

from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from pathlib import Path

import polars as pl

from ml_service.pulse import export_details, export_web
from ml_service.pulse.clean.pipeline import CleanData, clean_all
from ml_service.pulse.engine import PulseEngine
from ml_service.pulse.evaluate import run as evaluate_score
from ml_service.pulse.forecast.cli import FORECAST_MODELS
from ml_service.pulse.forecast.engine import ForecastEngine
from ml_service.pulse.forecast.evaluate import evaluate as evaluate_forecast
from ml_service.pulse.forecast.features import forecast_frame
from ml_service.pulse.load import RawData, load_raw
from ml_service.pulse.panel import build_panel
from ml_service.pulse.recommend import cli as advisor
from ml_service.pulse.run.options import MODELS_DIR, RunOptions
from ml_service.pulse.signals import cli as signals

EVALUATION_FILES = (
    "evaluation.json",
    "forecast_evaluation.json",
    "risk_evaluation.json",
    "signals_evaluation.json",
)
"""Evaluation reports a frozen run copies next to the models it reuses."""


@dataclass
class Inputs:
    """Raw and cleaned tables, loaded once per run."""

    raw: RawData
    clean: CleanData


def prepare_frozen(opts: RunOptions) -> None:
    """Copy the frozen models (and their evaluation reports) into the run's work dir."""
    target = opts.work_dir / MODELS_DIR
    if opts.models_dir.resolve() == target.resolve():
        return
    if not opts.models_dir.is_dir():
        raise FileNotFoundError(
            f"no frozen models in {opts.models_dir}; run `uv run pulse` first"
        )
    shutil.copytree(opts.models_dir, target, dirs_exist_ok=True)
    for name in EVALUATION_FILES:
        source = opts.models_dir.parent / name
        if source.exists():
            shutil.copy(source, opts.work_dir / name)


def build(opts: RunOptions) -> tuple[Inputs, pl.DataFrame]:
    """Raw CSVs -> cleaned tables -> company x month panel (+ cleaning report)."""
    raw = load_raw(opts.raw_dir, opts.work_dir / "cache")
    clean = clean_all(raw)
    panel = build_panel(clean)
    opts.work_dir.mkdir(parents=True, exist_ok=True)
    panel.write_parquet(opts.work_dir / "panel.parquet")
    clean.transactions.write_parquet(opts.work_dir / "clean_transactions.parquet")
    clean.report.save(opts.work_dir / "cleaning_report.json")
    return Inputs(raw, clean), panel


def score(opts: RunOptions, panel: pl.DataFrame) -> pl.DataFrame:
    """Fit (or load) the PULSE normaliser and score every company-month."""
    models = opts.work_dir / MODELS_DIR
    if opts.frozen:
        engine = PulseEngine.load(models)
    else:
        engine = PulseEngine.fit(panel)
        engine.save(models)
    scored = engine.score(panel)
    scored.write_parquet(opts.work_dir / "scored_panel.parquet")
    if opts.evaluate and not opts.frozen:
        evaluate_score(opts.work_dir)
    return scored


def forecast(opts: RunOptions, inputs: Inputs, scored: pl.DataFrame) -> pl.DataFrame:
    """Fit (or load) the forecast model and predict +1..+6 months from the last month."""
    frame = forecast_frame(scored, inputs.clean)
    frame.write_parquet(opts.work_dir / "forecast_frame.parquet")
    models = opts.work_dir / FORECAST_MODELS
    if opts.frozen:
        engine = ForecastEngine.load(models)
    else:
        engine = ForecastEngine.fit(frame)
        engine.save(models)
        if opts.evaluate:
            report = evaluate_forecast(frame)
            (opts.work_dir / "forecast_evaluation.json").write_text(
                json.dumps(report, indent=1)
            )
    predicted = engine.predict(frame, latest_only=True)
    predicted.write_parquet(opts.work_dir / "forecast.parquet")
    predicted.with_columns(
        pl.col("month", "target_month").dt.strftime("%Y-%m")
    ).write_csv(opts.work_dir / "forecast.csv")
    return predicted


def detect_signals(opts: RunOptions) -> None:
    """Fit (or load) the persistence model and score every episode of the panel."""
    if not opts.frozen:
        signals.fit(opts.work_dir)
    signals.build(opts.work_dir)


def recommend(opts: RunOptions) -> None:
    """Fit (or load) the risk scorecard and build every company's recommendation."""
    if not opts.frozen:
        advisor.fit(opts.work_dir)
    advisor.build(opts.work_dir, opts.raw_dir)


def export(opts: RunOptions, inputs: Inputs, scored: pl.DataFrame) -> Path:
    """Write the web JSON (summary, companies, details) under ``<work dir>/web``."""
    web = export_web.write_all(opts.work_dir)
    export_details.write_payloads(web, inputs.clean, inputs.raw, scored)
    return web


def load_scored(opts: RunOptions) -> pl.DataFrame:
    """Scored panel of a previous run, for export-only runs."""
    path = opts.work_dir / "scored_panel.parquet"
    if not path.exists():
        raise FileNotFoundError(f"{path} not found; run the pipeline first")
    return pl.read_parquet(path)
