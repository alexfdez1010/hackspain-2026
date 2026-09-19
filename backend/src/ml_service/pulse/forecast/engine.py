"""ForecastEngine: fit the single horizon-aware model and emit the forecast table."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import polars as pl

from ml_service.pulse.forecast.attribution import BASE, CONTEXT, aggregate
from ml_service.pulse.forecast.config import HORIZONS
from ml_service.pulse.forecast.features import (
    feature_columns,
    stack_horizons,
    to_matrix,
    with_horizon,
)
from ml_service.pulse.forecast.model import ForecastModel
from ml_service.pulse.variables import VARIABLES

KEY = ["company_id", "month"]


@dataclass
class ForecastEngine:
    """One frozen model; forecasts are PULSE now plus the predicted change, clipped to 0-100."""

    model: ForecastModel

    @classmethod
    def fit(
        cls, frame: pl.DataFrame, params: dict | None = None, **kwargs
    ) -> ForecastEngine:
        """Train on every (company-month, horizon) pair with an observed target.

        The p10-p90 band is calibrated out of fold by ``group_id`` when the frame
        carries it; ``kwargs`` (for example ``rounds``) reach ``ForecastModel.fit``.
        """
        features = feature_columns(frame)
        X, y, keys = stack_horizons(frame, features)
        groups = keys["group_id"].to_numpy() if "group_id" in keys.columns else None
        return cls(ForecastModel.fit(X, y, features, params, groups, **kwargs))

    def predict(self, frame: pl.DataFrame, latest_only: bool = True) -> pl.DataFrame:
        """One row per (company, month, horizon) with the forecast, its band and the decomposition."""
        rows = frame.filter(pl.col("pulse").is_not_null())
        if latest_only:
            rows = rows.filter(
                pl.col("month") == pl.col("month").max().over("company_id")
            )
        parts = [self._predict_horizon(rows, h) for h in HORIZONS]
        return pl.concat(parts).sort(KEY + ["horizon"])

    def _predict_horizon(self, rows: pl.DataFrame, h: int) -> pl.DataFrame:
        X = to_matrix(with_horizon(rows, h), self.model.features)
        delta, lo, hi = self.model.predict(X)
        now = rows["pulse"].to_numpy().astype(float)
        parts = aggregate(self.model.contributions(X), self.model.features)
        clip = lambda a: np.clip(a, 0, 100)
        out = rows.select(KEY, pulse_now=pl.col("pulse")).with_columns(
            pl.lit(h).alias("horizon"),
            pl.col("month").dt.offset_by(f"{h}mo").alias("target_month"),
            pl.Series("delta", delta),
            pl.Series("pulse_pred", clip(now + delta)),
            pl.Series("pulse_p10", clip(now + lo)),
            pl.Series("pulse_p90", clip(now + hi)),
        )
        contrib_cols = [
            pl.Series(f"contrib_{k}", parts[k])
            for k in [v.key for v in VARIABLES] + [CONTEXT, BASE]
        ]
        return out.with_columns(contrib_cols)

    def save(self, models_dir: Path) -> None:
        self.model.save(models_dir)

    @classmethod
    def load(cls, models_dir: Path) -> ForecastEngine:
        return cls(ForecastModel.load(models_dir))
