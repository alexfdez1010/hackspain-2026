"""Discrimination, rank and calibration metrics for the X-Ray evaluation."""

from __future__ import annotations

import numpy as np
import polars as pl
from scipy.stats import spearmanr
from sklearn.metrics import average_precision_score, roc_auc_score

MOVE_PTS = 5.0
N_BINS = 10


def _pair(a: np.ndarray, b: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Drop positions where either array is missing or non-finite."""
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    ok = np.isfinite(a) & np.isfinite(b)
    return a[ok], b[ok]


def auroc(y: np.ndarray, p: np.ndarray) -> float:
    """Area under the ROC curve, or NaN when a single class is present."""
    y, p = _pair(y, p)
    if y.size == 0 or len(np.unique(y)) < 2:
        return float("nan")
    return float(roc_auc_score(y, p))


def pr_auc(y: np.ndarray, p: np.ndarray) -> float:
    """Average precision (area under the precision-recall curve)."""
    y, p = _pair(y, p)
    if y.size == 0 or len(np.unique(y)) < 2:
        return float("nan")
    return float(average_precision_score(y, p))


def spearman(a: np.ndarray, b: np.ndarray) -> float:
    """Spearman rank correlation, NaN-safe."""
    a, b = _pair(a, b)
    if a.size < 3 or np.all(a == a[0]) or np.all(b == b[0]):
        return float("nan")
    return float(spearmanr(a, b).statistic)


def calibration_table(p: np.ndarray, y: np.ndarray, n_bins: int = N_BINS) -> list[dict]:
    """Decile table of predicted probability versus realised event rate.

    Args:
        p: Predicted probabilities.
        y: Binary outcomes.
        n_bins: Number of equal-count bins.

    Returns:
        One record per bin with its size, mean prediction and realised rate.
    """
    y, p = _pair(y, p)
    if p.size == 0:
        return []
    edges = np.quantile(p, np.linspace(0, 1, n_bins + 1))
    idx = np.clip(np.searchsorted(edges[1:-1], p, side="right"), 0, n_bins - 1)
    out = []
    for b in range(n_bins):
        m = idx == b
        if not m.any():
            continue
        out.append(
            {
                "bin": b + 1,
                "n": int(m.sum()),
                "p_mean": round(float(p[m].mean()), 4),
                "realised": round(float(y[m].mean()), 4),
            }
        )
    return out


def change_metrics(pred: np.ndarray, real: np.ndarray, pts: float = MOVE_PTS) -> dict:
    """Quality of the predicted 6-month change in both directions.

    Args:
        pred: Predicted change in composite points.
        real: Realised change in composite points.
        pts: Absolute change that separates a real move from noise.

    Returns:
        Rank correlation, sign agreement and per-direction recall (the share of
        real improvers/decliners the model also called in that direction).
    """
    pred, real = _pair(pred, real)
    if pred.size == 0:
        return {"n": 0}
    moved = np.abs(real) >= 1e-9
    up, down = real > pts, real < -pts
    return {
        "n": int(pred.size),
        "spearman": round(spearman(pred, real), 4),
        "sign_agreement": round(
            float((np.sign(pred) == np.sign(real))[moved].mean()), 4
        ),
        "n_improvers": int(up.sum()),
        "n_decliners": int(down.sum()),
        "improver_recall": round(float((pred[up] > 0).mean()), 4)
        if up.any()
        else float("nan"),
        "decliner_recall": round(float((pred[down] < 0).mean()), 4)
        if down.any()
        else float("nan"),
        "improver_mean_pred": round(float(pred[up].mean()), 3)
        if up.any()
        else float("nan"),
        "decliner_mean_pred": round(float(pred[down].mean()), 3)
        if down.any()
        else float("nan"),
    }


def prediction_report(df: pl.DataFrame) -> dict:
    """Full metric block for a frame of predictions with realised outcomes.

    Args:
        df: Rows holding ``y_stress``, ``p_stress``, ``composite``,
            ``pred_future_composite`` and ``y_future_composite``.

    Returns:
        Nested dict with stress discrimination, forward-composite rank
        correlation, both-direction change metrics and a calibration table.
    """
    y = df["y_stress"].cast(pl.Int32).to_numpy()
    p = df["p_stress"].to_numpy()
    pred_c = df["pred_future_composite"].to_numpy()
    real_c = df["y_future_composite"].to_numpy()
    base = df["composite"].to_numpy()
    return {
        "n_rows": int(df.height),
        "n_companies": int(df["company_id"].n_unique()),
        "stress_rate": round(float(np.nanmean(y)), 4),
        "auroc_stress": round(auroc(y, p), 4),
        "pr_auc_stress": round(pr_auc(y, p), 4),
        "spearman_future_composite": round(spearman(pred_c, real_c), 4),
        "change_6m": change_metrics(pred_c - base, real_c - base),
        "calibration": calibration_table(p, y),
    }
