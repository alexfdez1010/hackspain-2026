"""Out-of-fold forecast metrics against persistence and a one-parameter mean-reversion baseline.

The single model is fitted once per GroupKFold fold on the stacked (row, horizon)
matrix; the metrics are then reported per horizon on the out-of-fold predictions.
"""

from __future__ import annotations

import numpy as np
import polars as pl

from ml_service.pulse.forecast.config import BIG_MOVE, HORIZON_FEATURE
from ml_service.pulse.forecast.features import feature_columns, stack_horizons
from ml_service.pulse.forecast.model import (
    ForecastModel,
    band_quantiles,
    group_folds,
    train_booster,
)

TEMPORAL_CUT = np.datetime64("2025-08-01")
TEMPORAL_TEST_FROM = np.datetime64("2025-09-01")


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


def _oof_with_band(
    X: np.ndarray, y: np.ndarray, hz: np.ndarray, splits: list, params: dict | None
) -> tuple[np.ndarray, np.ndarray, np.ndarray, dict[int, float]]:
    """OOF predictions; each fold's band comes from the residuals of the *other* folds."""
    pred = np.zeros(len(y))
    importance: dict[int, float] = {}
    for tr, te in splits:
        booster = train_booster(X[tr], y[tr], params)
        pred[te] = booster.predict(X[te])
        gain = booster.feature_importance("gain")
        total = gain.sum() or 1.0
        for j, g in enumerate(gain):
            importance[j] = importance.get(j, 0.0) + g / total / len(splits)
    resid = y - pred
    lo, hi = np.zeros(len(y)), np.zeros(len(y))
    for tr, te in splits:
        band = band_quantiles(hz[tr], resid[tr])
        lo[te] = pred[te] + np.array([band.get(int(h), (0.0, 0.0))[0] for h in hz[te]])
        hi[te] = pred[te] + np.array([band.get(int(h), (0.0, 0.0))[1] for h in hz[te]])
    return pred, lo, hi, importance


def _temporal_backtest(
    X: np.ndarray,
    y: np.ndarray,
    hz: np.ndarray,
    months: np.ndarray,
    features: list[str],
    params: dict | None,
) -> dict[str, dict] | None:
    """Fit on months up to 2025-08 (target observable before the cut) and test from 2025-09."""
    train = months <= TEMPORAL_CUT - hz.astype("timedelta64[D]") * 31
    test = months >= TEMPORAL_TEST_FROM
    if train.sum() <= 500 or test.sum() <= 100:
        return None
    model = ForecastModel.fit(X[train], y[train], features, params)
    p_t, _, _ = model.predict(X[test])
    out = {}
    for h in np.unique(hz[test]):
        m = hz[test] == h
        out[str(int(h))] = {
            "rows": int(m.sum()),
            "mae_persist": round(float(np.abs(y[test][m]).mean()), 3),
            "mae_ml": round(float(np.abs(y[test][m] - p_t[m]).mean()), 3),
        }
    return out


def evaluate(frame: pl.DataFrame, params: dict | None = None) -> dict:
    """Group-wise OOF metrics per horizon and overall, plus a temporal backtest per horizon."""
    features = feature_columns(frame)
    X, y, keys = stack_horizons(frame, features)
    hz = keys[HORIZON_FEATURE].to_numpy().astype(int)
    cur = keys["pulse"].to_numpy().astype(float)
    splits = group_folds(keys["group_id"].to_numpy())
    pred, lo, hi, importance = _oof_with_band(X, y, hz, splits, params)
    rev = _reversion_baseline(cur, y, splits)
    horizons = {}
    for h in np.unique(hz):
        m = hz == h
        fold_m = [(tr[m[tr]], te[m[te]]) for tr, te in splits]
        rev_h = _reversion_baseline(cur[m], y[m], _reindex(fold_m, m))
        horizons[str(int(h))] = _metrics(y[m], pred[m], lo[m], hi[m], rev_h)
    top = sorted(importance.items(), key=lambda t: -t[1])[:10]
    result = {
        "n_features": len(features),
        "n_rows": len(y),
        "overall": _metrics(y, pred, lo, hi, rev),
        "horizons": horizons,
        "top_features": {features[j]: round(float(g), 4) for j, g in top},
    }
    temporal = _temporal_backtest(X, y, hz, keys["month"].to_numpy(), features, params)
    if temporal:
        result["temporal_backtest"] = temporal
    return result


def _reindex(fold_m: list, mask: np.ndarray) -> list:
    """Translate global row indices restricted to ``mask`` into positions within ``mask``."""
    pos = np.cumsum(mask) - 1
    return [(pos[tr], pos[te]) for tr, te in fold_m]
