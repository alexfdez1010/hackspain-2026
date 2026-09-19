"""PULSE arithmetic: component percentiles -> variable scores (with bank-proxy fallback) -> weighted 0-100 score + confidence."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import polars as pl

from ml_service.pulse.variables import (
    MIN_PROXY_COVERAGE,
    PILLARS,
    VARIABLES,
    Variable,
    coverage_column,
)

CALIBRATION_POINTS = 1001


def _effective(v: Variable, columns: set[str]) -> tuple[pl.Expr, pl.Expr, pl.Expr]:
    """(value, weight factor in [0, 1], source) for one variable.

    Primary components win. When all of them are unknown and the variable has
    bank proxies, the proxies are used and the factor is ``proxy_confidence``
    times the row's coverage column (1 when the panel has none). A coverage
    below ``MIN_PROXY_COVERAGE`` means the proxy saw too little of the
    company's collections to say anything: the variable stays unknown.
    """
    prim = [pl.col(f"{c.name}__pct") for c in v.components]
    prim_known = pl.any_horizontal([p.is_not_null() for p in prim])
    value = pl.when(prim_known).then(pl.mean_horizontal(prim))
    factor = pl.when(prim_known).then(pl.lit(1.0))
    source = pl.when(prim_known).then(pl.lit("primary"))
    if v.proxies:
        prox = [pl.col(f"{c.name}__pct") for c in v.proxies]
        prox_known = pl.any_horizontal([p.is_not_null() for p in prox])
        cov_col = coverage_column(v)
        coverage = (
            pl.col(cov_col).fill_null(1.0).clip(0.0, 1.0)
            if cov_col in columns
            else pl.lit(1.0)
        )
        prox_known = prox_known & (coverage >= MIN_PROXY_COVERAGE)
        value = value.when(prox_known).then(pl.mean_horizontal(prox))
        factor = factor.when(prox_known).then(v.proxy_confidence * coverage)
        source = source.when(prox_known).then(pl.lit("proxy"))
    return (
        value.otherwise(None),
        factor.otherwise(0.0),
        source.otherwise(pl.lit(None, dtype=pl.String)),
    )


def variable_scores(normed: pl.DataFrame) -> pl.DataFrame:
    """Add per variable: ``var_<key>`` (0-100), ``__known``, ``__weight`` (points it carries) and ``__source``."""
    exprs = []
    columns = set(normed.columns)
    for v in VARIABLES:
        value, factor, source = _effective(v, columns)
        exprs += [
            value.alias(f"var_{v.key}"),
            (factor > 0).alias(f"var_{v.key}__known"),
            (factor * v.weight).alias(f"var_{v.key}__weight"),
            source.alias(f"var_{v.key}__source"),
        ]
    return normed.with_columns(exprs)


def _weight(v: Variable) -> pl.Expr:
    return pl.col(f"var_{v.key}__weight")


def weighted_score(scored: pl.DataFrame) -> pl.DataFrame:
    """Add ``pulse_raw`` (effective weights renormalised), ``confidence`` (points backed by data / 100) and pillar scores.

    A proxy-backed variable carries only ``proxy_confidence`` x coverage of its
    weight, so it moves the score less and lowers ``confidence`` accordingly.
    """
    num = sum(pl.col(f"var_{v.key}").fill_null(0.0) * _weight(v) for v in VARIABLES)
    den = sum(_weight(v) for v in VARIABLES)
    out = scored.with_columns(
        pl.when(den > 0).then(num / den).otherwise(None).alias("pulse_raw"),
        (den / 100.0).alias("confidence"),
        (
            sum(
                pl.when(pl.col(f"var_{v.key}__source") == "proxy")
                .then(_weight(v))
                .otherwise(0.0)
                for v in VARIABLES
            )
            / 100.0
        ).alias("confidence_from_proxies"),
    )
    pillar_exprs = []
    for pillar in PILLARS:
        vs = [v for v in VARIABLES if v.pillar == pillar]
        pn = sum(pl.col(f"var_{v.key}").fill_null(0.0) * _weight(v) for v in vs)
        pd = sum(_weight(v) for v in vs)
        pillar_exprs.append(
            pl.when(pd > 0).then(pn / pd).otherwise(None).alias(f"pillar_{pillar}")
        )
    return out.with_columns(pillar_exprs)


def contributions(scored: pl.DataFrame) -> pl.DataFrame:
    """Add ``contrib_<key>``: points of the raw score each variable is responsible for (sum = pulse_raw)."""
    den = sum(_weight(v) for v in VARIABLES)
    return scored.with_columns(
        [
            (pl.col(f"var_{v.key}").fill_null(0.0) * _weight(v) / den).alias(
                f"contrib_{v.key}"
            )
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
