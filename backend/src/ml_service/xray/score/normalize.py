"""Quantile normalisation of raw features into directional 0-1 health signals."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import polars as pl

from ml_service.xray.config import FEATURE_SPECS

N_QUANTILES = 1001
NEUTRAL = 0.5


def _mid_rank(values: np.ndarray, grid: np.ndarray) -> np.ndarray:
    """Percentile of each value on the grid, using the mid-rank for ties.

    A plateau in the grid (e.g. 90% zeros for "returned debits") maps to the
    middle of the plateau instead of its upper edge, so a zero count is read
    as "typical", never as "bad".
    """
    left = np.searchsorted(grid, values, side="left")
    right = np.searchsorted(grid, values, side="right")
    return (left + right) / 2.0 / len(grid)


class QuantileNormalizer:
    """Map each feature to its empirical percentile on the training distribution.

    The percentile is flipped for features whose direction is -1, so every
    output column reads "higher = healthier". Missing values become the neutral
    0.5 and are flagged in a companion ``<name>__known`` column.
    """

    def __init__(self) -> None:
        self.grid: dict[str, list[float]] = {}

    def fit(self, panel: pl.DataFrame) -> QuantileNormalizer:
        """Learn per-feature quantile grids from the given rows."""
        qs = np.linspace(0, 1, N_QUANTILES)
        for spec in FEATURE_SPECS:
            values = panel[spec.name].drop_nulls().drop_nans().to_numpy()
            if values.size < 10:
                self.grid[spec.name] = [0.0, 1.0]
                continue
            self.grid[spec.name] = np.quantile(values, qs).tolist()
        return self

    def transform(self, panel: pl.DataFrame) -> pl.DataFrame:
        """Append ``<name>__norm`` (0-1, higher is better) and ``<name>__known`` columns."""
        cols = []
        for spec in FEATURE_SPECS:
            grid = np.asarray(self.grid[spec.name])
            raw = panel[spec.name].to_numpy().astype(float)
            known = ~np.isnan(raw)
            pct = _mid_rank(np.where(known, raw, 0.0), grid)
            if spec.direction < 0:
                pct = 1.0 - pct
            pct = np.where(known, pct, NEUTRAL)
            cols.append(pl.Series(f"{spec.name}__norm", pct))
            cols.append(pl.Series(f"{spec.name}__known", known))
        return panel.with_columns(cols)

    def save(self, path: Path) -> None:
        """Persist quantile grids as JSON."""
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.grid))

    @classmethod
    def load(cls, path: Path) -> QuantileNormalizer:
        """Restore a normaliser saved with :meth:`save`."""
        obj = cls()
        obj.grid = json.loads(path.read_text())
        return obj
