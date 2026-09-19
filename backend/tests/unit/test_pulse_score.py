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
from ml_service.pulse.variables import (
    MIN_PROXY_COVERAGE,
    VARIABLES,
    Component,
    coverage_column,
)


def _panel(n: int = 50) -> pl.DataFrame:
    rng = np.random.default_rng(0)
    data = {
        c.name: rng.normal(size=n)
        for v in VARIABLES
        for c in (*v.components, *v.proxies)
    }
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
            for c in (*v.components, *v.proxies)
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


def test_bank_proxies_back_a_variable_at_reduced_confidence():
    panel = _panel(20)
    normed = Normalizer().fit(panel).transform(panel)
    ar90 = next(v for v in VARIABLES if v.key == "ar90")
    top = next(v for v in VARIABLES if v.key == "top_client")
    normed = normed.with_columns(
        [
            pl.lit(None, dtype=pl.Float64).alias(f"{c.name}__pct")
            for c in (*ar90.components, *top.components)
        ]
        + [pl.lit(0.4).alias(coverage_column(top))]
    )
    scored = weighted_score(variable_scores(normed))
    assert (scored["var_ar90__source"] == "proxy").all()
    assert (scored["var_top_client__source"] == "proxy").all()
    assert (scored["var_dso__source"] == "primary").all()
    # #8 has no coverage column -> half its weight; #9 -> half x 0.4 of its weight
    expected = (100 - ar90.weight - top.weight) + 0.5 * ar90.weight + 0.2 * top.weight
    assert np.allclose(scored["confidence"].to_numpy(), expected / 100)
    assert np.allclose(
        scored["confidence_from_proxies"].to_numpy(),
        (0.5 * ar90.weight + 0.2 * top.weight) / 100,
    )
    proxy_pct = scored["returned_share__pct"].to_numpy()
    d3_pct = scored["returned_d3__pct"].to_numpy()
    assert np.allclose(scored["var_ar90"].to_numpy(), (proxy_pct + d3_pct) / 2)
    contrib = contributions(scored)
    total = sum(
        contrib[f"contrib_{v.key}"].fill_null(0.0).to_numpy() for v in VARIABLES
    )
    assert np.allclose(total, scored["pulse_raw"].to_numpy())


def test_proxy_below_minimum_coverage_stays_unknown():
    panel = _panel(20)
    normed = Normalizer().fit(panel).transform(panel)
    top = next(v for v in VARIABLES if v.key == "top_client")
    normed = normed.with_columns(
        [pl.lit(None, dtype=pl.Float64).alias(f"{c.name}__pct") for c in top.components]
        + [pl.lit(MIN_PROXY_COVERAGE / 2).alias(coverage_column(top))]
    )
    scored = weighted_score(variable_scores(normed))
    assert scored["var_top_client__source"].is_null().all()
    assert scored["var_top_client"].is_null().all()
    assert np.allclose(scored["confidence"].to_numpy(), (100 - top.weight) / 100)
