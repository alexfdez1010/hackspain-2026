"""Unit tests for PULSE normalisation and score arithmetic."""

import numpy as np
import polars as pl

from ml_service.pulse.normalize import Normalizer
from ml_service.pulse.score import (
    Calibration,
    contributions,
    variable_scores,
    weighted_score,
)
from ml_service.pulse.variables import VARIABLES, Component


def _panel(n: int = 50) -> pl.DataFrame:
    rng = np.random.default_rng(0)
    data = {c.name: rng.normal(size=n) for v in VARIABLES for c in v.components}
    data["maturities_ratio"] = np.abs(data["maturities_ratio"])
    data["maturities_ratio"][:10] = 0.0
    return pl.DataFrame(data)


def test_percentile_is_direction_aligned_and_mid_ranked():
    norm = Normalizer().fit(_panel())
    comp_up = Component("cash_days", 1)
    comp_down = Component("dso_days", -1)
    assert norm.percentile(comp_up, np.array([-10.0, 10.0])).tolist() == [0.0, 100.0]
    assert norm.percentile(comp_down, np.array([-10.0, 10.0])).tolist() == [100.0, 0.0]
    assert norm.percentile(comp_up, np.array([10.0]))[0] <= 100.0
    tied = np.zeros(5)
    norm.grids["cash_days"] = [0.0] * 500 + [1.0] * 501
    assert abs(norm.percentile(comp_up, tied)[0] - 25.0) < 0.1


def test_zero_is_best_maps_exact_zero_to_100():
    norm = Normalizer().fit(_panel())
    comp = next(
        c for v in VARIABLES for c in v.components if c.name == "maturities_ratio"
    )
    assert norm.percentile(comp, np.array([0.0]))[0] == 100.0


def test_unknown_variables_leave_the_denominator():
    panel = _panel(20)
    normed = Normalizer().fit(panel).transform(panel)
    normed = normed.with_columns(
        [
            pl.lit(None, dtype=pl.Float64).alias(f"{c.name}__pct")
            for v in VARIABLES
            if v.pillar == "cobro"
            for c in v.components
        ]
    )
    scored = weighted_score(variable_scores(normed))
    known_weight = sum(v.weight for v in VARIABLES if v.pillar != "cobro")
    assert np.allclose(scored["confidence"].to_numpy(), known_weight / 100)
    assert scored["pillar_cobro"].is_null().all()
    assert scored["pulse_raw"].is_between(0, 100).all()
    contrib = contributions(scored)
    total = sum(
        contrib[f"contrib_{v.key}"].fill_null(0.0).to_numpy() for v in VARIABLES
    )
    assert np.allclose(total, scored["pulse_raw"].to_numpy())


def test_calibration_spreads_scores_over_0_100():
    raw = np.linspace(30, 70, 1000)
    cal = Calibration().fit(raw)
    out = cal.apply(np.array([30.0, 50.0, 70.0]))
    assert out[0] < 0.1 and abs(out[1] - 50) < 0.1 and out[2] > 99.9
