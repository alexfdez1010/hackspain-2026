"""Empirical-percentile normaliser: raw component -> 0-100 'higher is healthier', frozen after fit."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import polars as pl

from ml_service.pulse.variables import VARIABLES, Component

GRID_POINTS = 1001


@dataclass
class Normalizer:
    """Per-component quantile grids; ties map to the mid-rank so a mass at zero is 'typical'."""

    grids: dict[str, list[float]] = field(default_factory=dict)

    @staticmethod
    def components() -> tuple[Component, ...]:
        return tuple(c for v in VARIABLES for c in (*v.components, *v.proxies))

    def fit(self, panel: pl.DataFrame) -> Normalizer:
        qs = np.linspace(0, 1, GRID_POINTS)
        for comp in self.components():
            values = panel[comp.name].drop_nulls().to_numpy()
            if len(values) == 0:
                continue
            self.grids[comp.name] = np.quantile(values, qs).tolist()
        return self

    def percentile(self, comp: Component, values: np.ndarray) -> np.ndarray:
        """Mid-rank percentile (0-100) of ``values`` on the fitted grid, sign-aligned to health."""
        grid = np.asarray(self.grids[comp.name])
        lo = np.searchsorted(grid, values, side="left") / len(grid)
        hi = np.searchsorted(grid, values, side="right") / len(grid)
        pct = (lo + hi) / 2 * 100
        pct = pct if comp.direction > 0 else 100 - pct
        if comp.zero_is_best:
            pct = np.where(values == 0, 100.0, pct)
        return pct

    def transform(self, panel: pl.DataFrame) -> pl.DataFrame:
        """Add ``<component>__pct`` columns (null where the raw value is null)."""
        out = panel
        for comp in self.components():
            if comp.name not in self.grids:
                out = out.with_columns(
                    pl.lit(None, dtype=pl.Float64).alias(f"{comp.name}__pct")
                )
                continue
            raw = out[comp.name].to_numpy()
            mask = ~np.isnan(raw.astype(float))
            pct = np.full(len(raw), np.nan)
            pct[mask] = self.percentile(comp, raw[mask].astype(float))
            out = out.with_columns(pl.Series(f"{comp.name}__pct", pct).fill_nan(None))
        return out

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(self.grids))

    @classmethod
    def load(cls, path: Path) -> Normalizer:
        return cls(grids=json.loads(path.read_text()))
