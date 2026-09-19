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
from ml_service.pulse.score import Calibration
from ml_service.pulse.variables import VARIABLES

KEY = ["company_id", "month"]


@dataclass
class ForecastEngine:
    """Frozen horizon models plus the PULSE calibration used to express forecasts on the 0-100 scale."""

    models: dict[int, HorizonModel]
    calibration: Calibration

    @classmethod
    def fit(
        cls, frame: pl.DataFrame, calibration: Calibration, params: dict | None = None
    ) -> ForecastEngine:
        features = feature_columns(frame)
        models = {}
        for h in HORIZONS:
            rows = frame.filter(pl.col(f"{TARGET_PREFIX}{h}").is_not_null())
            X, y = (
                to_matrix(rows, features),
                rows[f"{TARGET_PREFIX}{h}"].to_numpy().astype(float),
            )
            models[h] = HorizonModel.fit(X, y, h, features, params)
        return cls(models, calibration)

    def predict(self, frame: pl.DataFrame, latest_only: bool = True) -> pl.DataFrame:
        """One row per (company, month, horizon) with the forecast, its band and the decomposition."""
        rows = frame.filter(pl.col("pulse_raw").is_not_null())
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
        raw_now = rows["pulse_raw"].to_numpy().astype(float)
        parts = aggregate(model.contributions(X), model.features)
        clip = lambda a: np.clip(a, 0, 100)
        out = rows.select(
            KEY, pulse_now=pl.col("pulse"), pulse_raw_now=pl.col("pulse_raw")
        ).with_columns(
            pl.lit(h).alias("horizon"),
            pl.col("month").dt.offset_by(f"{h}mo").alias("target_month"),
            pl.Series("delta_raw", delta),
            pl.Series("pulse_raw_pred", clip(raw_now + delta)),
            pl.Series("pulse_pred", self.calibration.apply(clip(raw_now + delta))),
            pl.Series("pulse_p10", self.calibration.apply(clip(raw_now + lo))),
            pl.Series("pulse_p90", self.calibration.apply(clip(raw_now + hi))),
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
    def load(cls, models_dir: Path, calibration: Calibration) -> ForecastEngine:
        return cls({h: HorizonModel.load(models_dir, h) for h in HORIZONS}, calibration)
