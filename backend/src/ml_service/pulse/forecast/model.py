"""One horizon = three LightGBM boosters (point, p10, p90) on the change of pulse."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import lightgbm as lgb
import numpy as np

from ml_service.pulse.forecast.config import (
    POINT_PARAMS,
    POINT_ROUNDS,
    QUANTILE_HIGH,
    QUANTILE_LOW,
    QUANTILE_ROUNDS,
)


def train_booster(
    X: np.ndarray, y: np.ndarray, params: dict, rounds: int
) -> lgb.Booster:
    return lgb.train(params, lgb.Dataset(X, y), num_boost_round=rounds)


@dataclass
class HorizonModel:
    """Predicts ``pulse(t+h) - pulse(t)`` with a central estimate and a p10-p90 band."""

    horizon: int
    features: list[str]
    point: lgb.Booster
    low: lgb.Booster
    high: lgb.Booster

    @classmethod
    def fit(
        cls,
        X: np.ndarray,
        y: np.ndarray,
        horizon: int,
        features: list[str],
        params: dict | None = None,
    ) -> HorizonModel:
        params = params or POINT_PARAMS
        quantile = {**params, "objective": "quantile"}
        return cls(
            horizon,
            list(features),
            train_booster(X, y, params, POINT_ROUNDS),
            train_booster(X, y, {**quantile, "alpha": QUANTILE_LOW}, QUANTILE_ROUNDS),
            train_booster(X, y, {**quantile, "alpha": QUANTILE_HIGH}, QUANTILE_ROUNDS),
        )

    def predict(self, X: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        """(delta, delta_p10, delta_p90); the band is forced to contain the central estimate."""
        delta = self.point.predict(X)
        lo = np.minimum(self.low.predict(X), delta)
        hi = np.maximum(self.high.predict(X), delta)
        return delta, lo, hi

    def contributions(self, X: np.ndarray) -> np.ndarray:
        """Exact additive decomposition of ``delta``: one column per feature plus a bias column."""
        return self.point.predict(X, pred_contrib=True)

    def feature_importance(self) -> dict[str, float]:
        gain = self.point.feature_importance("gain")
        total = gain.sum() or 1.0
        return {
            f: round(float(g / total), 4)
            for f, g in sorted(zip(self.features, gain), key=lambda t: -t[1])
        }

    def save(self, models_dir: Path) -> None:
        models_dir.mkdir(parents=True, exist_ok=True)
        for name, booster in (
            ("point", self.point),
            ("low", self.low),
            ("high", self.high),
        ):
            booster.save_model(str(models_dir / f"h{self.horizon}_{name}.txt"))
        (models_dir / f"h{self.horizon}_features.json").write_text(
            json.dumps(self.features)
        )

    @classmethod
    def load(cls, models_dir: Path, horizon: int) -> HorizonModel:
        features = json.loads((models_dir / f"h{horizon}_features.json").read_text())
        boosters = [
            lgb.Booster(model_file=str(models_dir / f"h{horizon}_{n}.txt"))
            for n in ("point", "low", "high")
        ]
        return cls(horizon, features, *boosters)
