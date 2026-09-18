"""Temporal (walk-forward) backtest of the X-Ray engine with a purged label gap."""

from __future__ import annotations

from datetime import datetime

import polars as pl

from ml_service.xray.metrics import prediction_report
from ml_service.xray.score.pipeline import ScoreEngine
from ml_service.xray.score.targets import HORIZON

CUTOFF = datetime(2025, 8, 1)


def _month_range(df: pl.DataFrame) -> dict:
    """First and last month present in ``df`` as ``YYYY-MM`` strings."""
    if not df.height:
        return {"first": None, "last": None}
    return {"first": str(df["month"].min())[:7], "last": str(df["month"].max())[:7]}


def split_panel(
    panel: pl.DataFrame, cutoff: datetime = CUTOFF
) -> tuple[pl.DataFrame, pl.DataFrame]:
    """Split a panel into the training window (<= cutoff) and the test window."""
    return panel.filter(pl.col("month") <= cutoff), panel.filter(
        pl.col("month") > cutoff
    )


def temporal_backtest(
    panel: pl.DataFrame, cutoff: datetime = CUTOFF, horizon: int = HORIZON
) -> dict:
    """Fit on months <= ``cutoff`` only and evaluate on the months after it.

    Targets for training are built on the truncated panel, so a training row
    only carries a label when its whole forward horizon falls inside the
    training window. The last labelled training month is therefore ``cutoff -
    horizon``, which purges the ``horizon`` months of label overlap with the
    first test month.

    Args:
        panel: Full feature panel (all months).
        cutoff: Last month the model is allowed to see.
        horizon: Forward horizon in months, used only for reporting the gap.

    Returns:
        Metric block for the out-of-time rows plus the split metadata.
    """
    train, _ = split_panel(panel, cutoff)
    if not train.height:
        raise ValueError(f"No training rows on or before {cutoff:%Y-%m}")
    engine = ScoreEngine.fit(train, cross_validate=False)
    prepared = engine.prepare(panel)
    preds = engine.models.predict(prepared)
    test = preds.filter((pl.col("month") > cutoff) & pl.col("has_future"))
    labelled_train = engine.prepare(train).filter(pl.col("has_future"))
    report = prediction_report(test)
    report["split"] = {
        "cutoff": f"{cutoff:%Y-%m}",
        "horizon_months": horizon,
        "train_rows": int(train.height),
        "train_labelled_rows": int(labelled_train.height),
        "train_label_months": _month_range(labelled_train),
        "test_months": _month_range(test),
        "purge_gap_months": horizon,
    }
    return report


def backtest_scores(panel: pl.DataFrame, cutoff: datetime = CUTOFF) -> pl.DataFrame:
    """Score the whole panel with an engine that only saw months <= ``cutoff``."""
    train, _ = split_panel(panel, cutoff)
    return ScoreEngine.fit(train, cross_validate=False).score(panel)
