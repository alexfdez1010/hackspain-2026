"""Out-of-fold forecast metrics against persistence and a one-parameter mean-reversion baseline."""

from __future__ import annotations

import numpy as np
import polars as pl
from sklearn.model_selection import GroupKFold

from ml_service.pulse.forecast.config import BIG_MOVE, HORIZONS
from ml_service.pulse.forecast.features import TARGET_PREFIX, feature_columns, to_matrix
from ml_service.pulse.forecast.model import HorizonModel

TEMPORAL_CUT = np.datetime64("2025-08-01")
TEMPORAL_TEST_FROM = np.datetime64("2025-09-01")
N_FOLDS = 5


def _reversion_baseline(cur: np.ndarray, y: np.ndarray, splits) -> np.ndarray:
    """Out-of-fold ``beta * (mean - current)``: the part of any forecast that is just mean reversion."""
    rev = np.zeros(len(y))
    for tr, te in splits:
        z = cur[tr].mean() - cur[tr]
        beta = float((z * y[tr]).sum() / (z * z).sum()) if (z * z).sum() > 0 else 0.0
        rev[te] = beta * (cur[tr].mean() - cur[te])
    return rev


def _metrics(
    y: np.ndarray, pred: np.ndarray, lo: np.ndarray, hi: np.ndarray, rev: np.ndarray
) -> dict:
    big = np.abs(y) > BIG_MOVE
    decl, impr = y < -BIG_MOVE, y > BIG_MOVE
    return {
        "n": len(y),
        "mae_persist": round(float(np.abs(y).mean()), 3),
        "mae_reversion": round(float(np.abs(y - rev).mean()), 3),
        "mae_ml": round(float(np.abs(y - pred).mean()), 3),
        "gain_vs_persist_pct": round(
            float(
                (np.abs(y).mean() - np.abs(y - pred).mean()) / np.abs(y).mean() * 100
            ),
            1,
        ),
        "gain_vs_reversion_pct": round(
            float(
                (np.abs(y - rev).mean() - np.abs(y - pred).mean())
                / np.abs(y - rev).mean()
                * 100
            ),
            1,
        ),
        "corr_change": round(float(np.corrcoef(pred, y)[0, 1]), 3),
        "direction_accuracy_big_moves": round(
            float((np.sign(pred[big]) == np.sign(y[big])).mean()), 3
        )
        if big.any()
        else None,
        "recall_declines": round(float((pred[decl] < -5).mean()), 3)
        if decl.any()
        else None,
        "recall_improvements": round(float((pred[impr] > 5).mean()), 3)
        if impr.any()
        else None,
        "band_p10_p90_coverage": round(float(((y >= lo) & (y <= hi)).mean()), 3),
    }


def evaluate_horizon(
    frame: pl.DataFrame, h: int, features: list[str], params: dict | None = None
) -> dict:
    """Group-wise OOF metrics for one horizon plus a temporal backtest (fit <= 2025-08, test >= 2025-09)."""
    rows = frame.filter(pl.col(f"{TARGET_PREFIX}{h}").is_not_null())
    X, y = (
        to_matrix(rows, features),
        rows[f"{TARGET_PREFIX}{h}"].to_numpy().astype(float),
    )
    cur, groups, months = (
        rows["pulse_raw"].to_numpy().astype(float),
        rows["group_id"].to_numpy(),
        rows["month"].to_numpy(),
    )
    splits = list(GroupKFold(N_FOLDS).split(X, y, groups))
    pred, lo, hi = np.zeros(len(y)), np.zeros(len(y)), np.zeros(len(y))
    importance: dict[str, float] = {}
    for tr, te in splits:
        model = HorizonModel.fit(X[tr], y[tr], h, features, params)
        pred[te], lo[te], hi[te] = model.predict(X[te])
        for f, g in model.feature_importance().items():
            importance[f] = importance.get(f, 0.0) + g / N_FOLDS
    result = _metrics(y, pred, lo, hi, _reversion_baseline(cur, y, splits))
    train = months <= TEMPORAL_CUT - np.timedelta64(31 * h, "D")
    test = months >= TEMPORAL_TEST_FROM
    if train.sum() > 500 and test.sum() > 100:
        model = HorizonModel.fit(X[train], y[train], h, features, params)
        p_t, _, _ = model.predict(X[test])
        result["temporal_backtest"] = {
            "rows": int(test.sum()),
            "mae_persist": round(float(np.abs(y[test]).mean()), 3),
            "mae_ml": round(float(np.abs(y[test] - p_t).mean()), 3),
        }
    result["top_features"] = dict(sorted(importance.items(), key=lambda t: -t[1])[:10])
    return result


def evaluate(frame: pl.DataFrame, params: dict | None = None) -> dict:
    features = feature_columns(frame)
    return {
        "n_features": len(features),
        "horizons": {
            str(h): evaluate_horizon(frame, h, features, params) for h in HORIZONS
        },
    }
