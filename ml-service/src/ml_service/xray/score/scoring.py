"""Blend level, forward view and trajectory into the final 0-100 X-Ray score."""

from __future__ import annotations

import numpy as np
import polars as pl
from scipy.stats import theilslopes

W_LEVEL = 0.45
W_FORWARD = 0.35
W_STRESS = 0.20
SMOOTH_ALPHA = 0.6
TREND_WINDOW = 6


def _pdo_scale(
    prob_bad: np.ndarray, pdo: float = 12.0, base_score: float = 60.0
) -> np.ndarray:
    """Scorecard scaling: score = base + factor * ln(odds_good), clipped to 0-100."""
    p = np.clip(prob_bad, 1e-4, 1 - 1e-4)
    factor = pdo / np.log(2)
    return np.clip(
        base_score + factor * np.log((1 - p) / p) - factor * np.log(3.0), 0, 100
    )


def _theil_sen(values: np.ndarray) -> float:
    if np.isnan(values).sum() > len(values) - 3:
        return float("nan")
    idx = np.arange(len(values))
    ok = ~np.isnan(values)
    return float(theilslopes(values[ok], idx[ok])[0])


def fit_calibration(score_raw: np.ndarray, n: int = 201) -> list[float]:
    """Quantile grid of the raw blend on training rows, used to stretch to 0-100."""
    return np.quantile(score_raw[~np.isnan(score_raw)], np.linspace(0, 1, n)).tolist()


def calibrate(score_raw: np.ndarray, grid: list[float]) -> np.ndarray:
    """Map the raw blend to its training percentile (0-100), softened at the tails."""
    pct = np.interp(score_raw, np.asarray(grid), np.linspace(0, 1, len(grid)))
    return np.clip(3 + 94 * pct, 0, 100)


def final_scores(
    panel: pl.DataFrame, calibration: list[float] | None = None
) -> pl.DataFrame:
    """Add ``score_raw``, ``score`` (smoothed), ``trend_6m`` and ``direction``.

    score_raw blends: current pillar composite (level), model view of the
    composite six months ahead (forward), and scorecard-scaled stress
    probability (risk). ``score`` is an exponentially smoothed version so a
    single bad month moves it less than a persistent deterioration.
    """
    panel = panel.sort("company_id", "month")
    stress_pts = _pdo_scale(panel["p_stress"].to_numpy())
    raw = (
        W_LEVEL * panel["composite"].to_numpy()
        + W_FORWARD * panel["pred_future_composite"].to_numpy()
        + W_STRESS * stress_pts
    )
    raw = np.clip(raw, 0, 100)
    if calibration is not None:
        raw = calibrate(raw, calibration)
    panel = panel.with_columns(
        pl.Series("score_raw", raw), pl.Series("stress_points", stress_pts)
    )
    panel = panel.with_columns(
        pl.col("score_raw")
        .ewm_mean(alpha=SMOOTH_ALPHA, adjust=True)
        .over("company_id")
        .alias("score")
    )
    slopes = []
    for _, g in panel.group_by("company_id", maintain_order=True):
        s = g["score"].to_numpy()
        for i in range(len(s)):
            win = s[max(0, i - TREND_WINDOW + 1) : i + 1]
            slopes.append(_theil_sen(win) if len(win) >= 3 else float("nan"))
    panel = panel.with_columns(pl.Series("trend_6m", slopes))
    return panel.with_columns(
        pl.when(pl.col("trend_6m") >= 1.5)
        .then(pl.lit("improving"))
        .when(pl.col("trend_6m") <= -1.5)
        .then(pl.lit("deteriorating"))
        .otherwise(pl.lit("stable"))
        .alias("direction"),
        (pl.col("score") - pl.col("score").shift(1).over("company_id")).alias(
            "score_delta_1m"
        ),
    )
