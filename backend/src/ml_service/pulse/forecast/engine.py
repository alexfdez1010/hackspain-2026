"""ForecastEngine: fit one HorizonModel per horizon and emit the forecast table."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import polars as pl

from ml_service.pulse.forecast.attribution import BASE, CONTEXT, aggregate
from ml_service.pulse.forecast.config import HORIZONS
from ml_service.pulse.forecast.features import TARGET_PREFIX, feature_columns, to_matrix
from ml_service.pulse.forecast.model import HorizonModel
from ml_service.pulse.variables import VARIABLES

KEY = ["company_id", "month"]


@dataclass
class ForecastEngine:
    """Frozen horizon models; forecasts are PULSE now plus the predicted change, clipped to 0-100."""

    models: dict[int, HorizonModel]

    @classmethod
    def fit(cls, frame: pl.DataFrame, params: dict | None = None) -> ForecastEngine:
        features = feature_columns(frame)
        models = {}
        for h in HORIZONS:
            rows = frame.filter(pl.col(f"{TARGET_PREFIX}{h}").is_not_null())
            X, y = (
                to_matrix(rows, features),
                rows[f"{TARGET_PREFIX}{h}"].to_numpy().astype(float),
            )
            models[h] = HorizonModel.fit(X, y, h, features, params)
        return cls(models)

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
        model = self.models[h]
        X = to_matrix(rows, model.features)
        delta, lo, hi = model.predict(X)
        now = rows["pulse"].to_numpy().astype(float)
        parts = aggregate(model.contributions(X), model.features)
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
        for model in self.models.values():
            model.save(models_dir)

    @classmethod
    def load(cls, models_dir: Path) -> ForecastEngine:
        return cls({h: HorizonModel.load(models_dir, h) for h in HORIZONS})
