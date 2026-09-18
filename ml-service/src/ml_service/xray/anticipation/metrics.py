"""Discrimination metrics: can today's score rank tomorrow's stress?"""

from __future__ import annotations

import numpy as np
import polars as pl
from sklearn.metrics import roc_auc_score

from ml_service.xray.anticipation.events import with_stress_flag

HORIZONS: tuple[int, ...] = (1, 3, 6)
MIN_ROWS = 50


def future_stress(panel: pl.DataFrame, horizon: int) -> pl.DataFrame:
    """Rows where the next ``horizon`` months are observable, with their label."""
    ordered = with_stress_flag(panel.sort("company_id", "month"))
    shifts = [
        pl.col("_stress").shift(-k).over("company_id") for k in range(1, horizon + 1)
    ]
    observable = pl.col("_stress").shift(-horizon).over("company_id").is_not_null()
    return (
        ordered.with_columns(
            pl.sum_horizontal([s.fill_null(0) for s in shifts]).gt(0).alias("_label"),
            observable.alias("_observable"),
        )
        .filter(pl.col("_observable"))
        .drop("_stress", "_observable")
    )


def auroc_by_horizon(
    panel: pl.DataFrame,
    score_col: str = "score",
    horizons: tuple[int, ...] = HORIZONS,
) -> dict[str, dict[str, float | int | None]]:
    """AUROC of the score at ``t`` for any stress in ``(t, t + h]``.

    Args:
        panel: Any frame with ``company_id``, ``month``, ``stress_now`` and the
            score column (the scored panel, or out-of-fold predictions).
        score_col: Column used as the ranker; lower means riskier.
        horizons: Horizons in months.

    Returns:
        ``{"h1": {"auroc": ..., "n": ..., "positives": ...}, ...}``; ``auroc``
        is ``None`` when the sample is too small or single-class.
    """
    out: dict[str, dict[str, float | int | None]] = {}
    for horizon in horizons:
        rows = future_stress(panel, horizon)
        labels = rows["_label"].cast(pl.Int32).to_numpy()
        scores = rows[score_col].cast(pl.Float64).to_numpy()
        keep = ~np.isnan(scores)
        labels, scores = labels[keep], scores[keep]
        usable = labels.size >= MIN_ROWS and 0 < labels.sum() < labels.size
        out[f"h{horizon}"] = {
            "auroc": round(float(roc_auc_score(labels, -scores)), 4)
            if usable
            else None,
            "n": int(labels.size),
            "positives": int(labels.sum()),
        }
    return out
