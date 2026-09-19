"""One LightGBM booster for every horizon, plus a conformal p10-p90 band per horizon.

The booster predicts ``pulse(t+h) - pulse(t)`` and reads ``h`` as an ordinary input
(``HORIZON_FEATURE``), so adding a horizon is a config change, not a new model. The
band is the empirical 10th/90th percentile of the out-of-fold residual at each
horizon, which keeps the 80 % coverage honest without training extra models.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import lightgbm as lgb
import numpy as np
from sklearn.model_selection import GroupKFold

from ml_service.pulse.forecast.config import (
    HORIZON_FEATURE,
    N_FOLDS,
    POINT_PARAMS,
    POINT_ROUNDS,
    QUANTILE_HIGH,
    QUANTILE_LOW,
)

MODEL_FILE = "model.txt"
META_FILE = "model.json"


def train_booster(
    X: np.ndarray, y: np.ndarray, params: dict | None = None, rounds: int = POINT_ROUNDS
) -> lgb.Booster:
    return lgb.train(params or POINT_PARAMS, lgb.Dataset(X, y), num_boost_round=rounds)


def group_folds(groups: np.ndarray, n_folds: int = N_FOLDS) -> list:
    """GroupKFold splits (train, test) capped by the number of distinct groups."""
    k = max(2, min(n_folds, len(np.unique(groups))))
    return list(GroupKFold(k).split(groups, groups, groups))


def oof_predictions(
    X: np.ndarray,
    y: np.ndarray,
    splits: list,
    params: dict | None = None,
    rounds: int = POINT_ROUNDS,
) -> np.ndarray:
    """Out-of-fold central predictions: every row scored by a booster that never saw it."""
    pred = np.zeros(len(y))
    for tr, te in splits:
        pred[te] = train_booster(X[tr], y[tr], params, rounds).predict(X[te])
    return pred


def band_quantiles(
    horizons: np.ndarray, residuals: np.ndarray
) -> dict[int, tuple[float, float]]:
    """Per horizon, the (p10, p90) of ``y - prediction``; the band always contains zero."""
    out = {}
    for h in np.unique(horizons):
        r = residuals[horizons == h]
        lo, hi = np.quantile(r, [QUANTILE_LOW, QUANTILE_HIGH])
        out[int(h)] = (float(min(lo, 0.0)), float(max(hi, 0.0)))
    return out


@dataclass
class ForecastModel:
    """The single forecaster: features (with the horizon column), booster and band."""

    features: list[str]
    booster: lgb.Booster
    band: dict[int, tuple[float, float]]

    @property
    def horizon_index(self) -> int:
        return self.features.index(HORIZON_FEATURE)

    @classmethod
    def fit(
        cls,
        X: np.ndarray,
        y: np.ndarray,
        features: list[str],
        params: dict | None = None,
        groups: np.ndarray | None = None,
        rounds: int = POINT_ROUNDS,
    ) -> ForecastModel:
        """Train on the stacked (row, horizon) matrix.

        With ``groups`` the band is calibrated on out-of-fold residuals (one extra
        booster per fold); without them it falls back to in-sample residuals, which
        is only acceptable for smoke tests.
        """
        features = list(features)
        booster = train_booster(X, y, params, rounds)
        if groups is not None:
            resid = y - oof_predictions(X, y, group_folds(groups), params, rounds)
        else:
            resid = y - booster.predict(X)
        band = band_quantiles(X[:, features.index(HORIZON_FEATURE)], resid)
        return cls(features, booster, band)

    def predict(self, X: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """(delta, delta_p10, delta_p90) with the band offsets read from each row's horizon."""
        delta = self.booster.predict(X)
        horizons = X[:, self.horizon_index].astype(int)
        lo = np.array([self.band.get(h, (0.0, 0.0))[0] for h in horizons])
        hi = np.array([self.band.get(h, (0.0, 0.0))[1] for h in horizons])
        return delta, delta + lo, delta + hi

    def contributions(self, X: np.ndarray) -> np.ndarray:
        """Exact additive decomposition of ``delta``: one column per feature plus a bias column."""
        return self.booster.predict(X, pred_contrib=True)

    def feature_importance(self) -> dict[str, float]:
        gain = self.booster.feature_importance("gain")
        total = gain.sum() or 1.0
        return {
            f: round(float(g / total), 4)
            for f, g in sorted(zip(self.features, gain), key=lambda t: -t[1])
        }

    def save(self, models_dir: Path) -> None:
        models_dir.mkdir(parents=True, exist_ok=True)
        self.booster.save_model(str(models_dir / MODEL_FILE))
        meta = {
            "features": self.features,
            "band": {str(h): list(v) for h, v in self.band.items()},
        }
        (models_dir / META_FILE).write_text(json.dumps(meta))

    @classmethod
    def load(cls, models_dir: Path) -> ForecastModel:
        meta = json.loads((models_dir / META_FILE).read_text())
        band = {int(h): (float(v[0]), float(v[1])) for h, v in meta["band"].items()}
        return cls(
            meta["features"], lgb.Booster(model_file=str(models_dir / MODEL_FILE)), band
        )
