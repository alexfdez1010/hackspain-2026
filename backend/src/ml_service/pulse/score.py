"""PULSE arithmetic: component percentiles -> variable scores -> weighted 0-100 score + confidence."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import polars as pl

from ml_service.pulse.variables import PILLARS, VARIABLES

CALIBRATION_POINTS = 1001


def variable_scores(normed: pl.DataFrame) -> pl.DataFrame:
    """Add ``var_<key>`` (0-100, mean of the known component percentiles) and ``var_<key>__known``."""
    exprs = []
    for v in VARIABLES:
        pcts = [pl.col(f"{c.name}__pct") for c in v.components]
        exprs.append(pl.mean_horizontal(pcts).alias(f"var_{v.key}"))
        exprs.append(
            pl.any_horizontal([p.is_not_null() for p in pcts]).alias(
                f"var_{v.key}__known"
            )
        )
    return normed.with_columns(exprs)


def weighted_score(scored: pl.DataFrame) -> pl.DataFrame:
    """Add ``pulse_raw`` (weights renormalised over known variables), ``confidence`` and pillar scores."""
    num = sum(
        pl.col(f"var_{v.key}").fill_null(0.0) * pl.col(f"var_{v.key}__known") * v.weight
        for v in VARIABLES
    )
    den = sum(
        pl.col(f"var_{v.key}__known").cast(pl.Float64) * v.weight for v in VARIABLES
    )
    out = scored.with_columns(
        pl.when(den > 0).then(num / den).otherwise(None).alias("pulse_raw"),
        (den / 100.0).alias("confidence"),
    )
    pillar_exprs = []
    for pillar in PILLARS:
        vs = [v for v in VARIABLES if v.pillar == pillar]
        pn = sum(
            pl.col(f"var_{v.key}").fill_null(0.0)
            * pl.col(f"var_{v.key}__known")
            * v.weight
            for v in vs
        )
        pd = sum(pl.col(f"var_{v.key}__known").cast(pl.Float64) * v.weight for v in vs)
        pillar_exprs.append(
            pl.when(pd > 0).then(pn / pd).otherwise(None).alias(f"pillar_{pillar}")
        )
    return out.with_columns(pillar_exprs)


def contributions(scored: pl.DataFrame) -> pl.DataFrame:
    """Add ``contrib_<key>``: points of the raw score each variable is responsible for (sum = pulse_raw)."""
    den = sum(
        pl.col(f"var_{v.key}__known").cast(pl.Float64) * v.weight for v in VARIABLES
    )
    return scored.with_columns(
        [
            (
                pl.col(f"var_{v.key}").fill_null(0.0)
                * pl.col(f"var_{v.key}__known")
                * v.weight
                / den
            ).alias(f"contrib_{v.key}")
            for v in VARIABLES
        ]
    )


@dataclass
class Calibration:
    """Maps ``pulse_raw`` to its percentile in the training population, so PULSE spans 0-100.

    A PULSE of 80 reads: "healthier than 80 % of the companies the model was fitted on".
    """

    grid: list[float] = field(default_factory=list)

    def fit(self, raw: np.ndarray) -> Calibration:
        self.grid = np.quantile(
            raw[~np.isnan(raw)], np.linspace(0, 1, CALIBRATION_POINTS)
        ).tolist()
        return self

    def apply(self, raw: np.ndarray) -> np.ndarray:
        grid = np.asarray(self.grid)
        lo = np.searchsorted(grid, raw, side="left") / len(grid)
        hi = np.searchsorted(grid, raw, side="right") / len(grid)
        return np.round((lo + hi) / 2 * 100, 2)

    def save(self, path: Path) -> None:
        path.write_text(json.dumps(self.grid))

    @classmethod
    def load(cls, path: Path) -> Calibration:
        return cls(grid=json.loads(path.read_text()))


def apply_calibration(scored: pl.DataFrame, calibration: Calibration) -> pl.DataFrame:
    raw = scored["pulse_raw"].to_numpy().astype(float)
    pulse = np.full(len(raw), np.nan)
    mask = ~np.isnan(raw)
    pulse[mask] = calibration.apply(raw[mask])
    return scored.with_columns(pl.Series("pulse", pulse).fill_nan(None))
