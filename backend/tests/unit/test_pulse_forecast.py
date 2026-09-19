"""Unit tests for the PULSE forecast layer: attribution, targets and a tiny end-to-end fit."""

from datetime import datetime

import numpy as np
import polars as pl

from ml_service.pulse.forecast.attribution import (
    BASE,
    CONTEXT,
    aggregate,
    shares_of_feature,
)
from ml_service.pulse.forecast.config import (
    HORIZON_FEATURE,
    HORIZONS,
    POINT_PARAMS,
)
from ml_service.pulse.forecast.engine import ForecastEngine
from ml_service.pulse.forecast.features import (
    add_targets,
    feature_columns,
    stack_horizons,
)
from ml_service.pulse.forecast.features_flows import flow_dynamics
from ml_service.pulse.forecast.model import band_quantiles
from ml_service.pulse.variables import VARIABLES

FAST_PARAMS = {
    "objective": "huber",
    "learning_rate": 0.1,
    "num_leaves": 4,
    "min_data_in_leaf": 5,
    "verbose": -1,
}
FAST_ROUNDS = 20


def test_shares_map_features_to_their_variable():
    assert shares_of_feature("cash_days_d3") == {"cash_days": 1.0}
    assert shares_of_feature("loc_util_d3__pct") == {"loc_util": 1.0}
    assert shares_of_feature("var_ar90__known") == {"ar90": 1.0}
    assert shares_of_feature("inflow_growth_3m") == {CONTEXT: 1.0}
    pillar = shares_of_feature("pillar_liquidez_vol6")
    assert (
        set(pillar) == {"cash_days", "cash_min"}
        and abs(sum(pillar.values()) - 1) < 1e-9
    )
    assert abs(sum(shares_of_feature("pulse_d6").values()) - 1) < 1e-9


def test_aggregate_is_exact_decomposition():
    features = ["cash_days", "pillar_deuda", "pulse", "inflow"]
    contrib = np.array([[1.0, 2.0, 3.0, 4.0, 0.5], [-1.0, 0.0, 0.0, 0.0, 0.25]])
    parts = aggregate(contrib, features)
    total = sum(parts.values())
    assert np.allclose(total, contrib.sum(axis=1))
    assert parts[BASE].tolist() == [0.5, 0.25]
    assert parts[CONTEXT].tolist() == [4.0, 0.0]


def test_targets_are_future_change_and_null_at_the_edge():
    months = [datetime(2025, m, 1) for m in range(1, 9)]
    df = pl.DataFrame(
        {
            "company_id": ["C"] * 8,
            "month": months,
            "pulse": [float(10 * i) for i in range(8)],
        }
    )
    out = add_targets(df)
    assert out["y_1"].to_list()[:2] == [10.0, 10.0] and out["y_1"].to_list()[-1] is None
    assert out["y_6"].to_list()[0] == 60.0 and out["y_6"].null_count() == 6
    assert "y_12" not in out.columns and HORIZONS == tuple(range(1, 7))


def _synthetic_frame(n_companies: int = 30, n_months: int = 20) -> pl.DataFrame:
    rng = np.random.default_rng(1)
    rows = []
    for i in range(n_companies):
        level = rng.uniform(20, 80)
        for m in range(n_months):
            level = np.clip(level + rng.normal(0, 4), 0, 100)
            rows.append(
                {
                    "company_id": f"C{i}",
                    "group_id": f"G{i % 7}",
                    "month": datetime(2025, 1, 1).replace(
                        month=1 + m % 12, year=2025 + m // 12
                    ),
                    "pulse": level,
                    "cash_days": rng.uniform(0, 365),
                    "pillar_liquidez": rng.uniform(0, 100),
                }
            )
    return add_targets(pl.DataFrame(rows).sort("company_id", "month"))


def test_stack_pairs_every_month_with_every_observable_horizon():
    frame = _synthetic_frame(n_companies=3, n_months=15)
    features = feature_columns(frame)
    X, y, keys = stack_horizons(frame, features)
    assert features[-1] == HORIZON_FEATURE and HORIZON_FEATURE not in features[:-1]
    expected = sum(3 * (15 - h) for h in HORIZONS)
    assert X.shape == (expected, len(features)) and len(y) == expected
    assert keys[HORIZON_FEATURE].unique().sort().to_list() == [
        float(h) for h in HORIZONS
    ]
    assert set(X[:, -1].astype(int)) == set(HORIZONS)


def test_band_quantiles_always_contain_zero():
    hz = np.array([1, 1, 1, 2, 2, 2])
    band = band_quantiles(hz, np.array([1.0, 2.0, 3.0, -3.0, -2.0, -1.0]))
    assert band[1][0] == 0.0 and band[1][1] > 0 and band[2][0] < 0 and band[2][1] == 0.0


def test_engine_fits_predicts_and_decomposes(tmp_path):
    frame = _synthetic_frame()
    engine = ForecastEngine.fit(frame, FAST_PARAMS, rounds=FAST_ROUNDS)
    engine.save(tmp_path)
    engine = ForecastEngine.load(tmp_path)
    assert set(engine.model.band) == set(HORIZONS)
    out = engine.predict(frame, latest_only=True)
    assert out["horizon"].unique().sort().to_list() == list(HORIZONS)
    assert out["company_id"].n_unique() == 30 and out.shape[0] == 30 * len(HORIZONS)
    assert (out["pulse_p10"] <= out["pulse_pred"]).all() and (
        out["pulse_pred"] <= out["pulse_p90"]
    ).all()
    contribs = [f"contrib_{v.key}" for v in VARIABLES] + [
        f"contrib_{CONTEXT}",
        f"contrib_{BASE}",
    ]
    total = out.select(pl.sum_horizontal(contribs).alias("s"))["s"].to_numpy()
    assert np.allclose(total, out["delta"].to_numpy())
    assert "y_1" not in feature_columns(frame) and "group_id" not in feature_columns(
        frame
    )


def _drift_frame(n_companies: int = 40, n_months: int = 24) -> pl.DataFrame:
    """Companies whose PULSE drifts by a known amount per month, exposed as ``trend``."""
    rng = np.random.default_rng(3)
    rows = []
    for i in range(n_companies):
        level, drift = rng.uniform(30, 70), rng.uniform(-2, 2)
        for m in range(n_months):
            level = level + drift + rng.normal(0, 1)
            rows.append(
                {
                    "company_id": f"C{i}",
                    "group_id": f"G{i % 5}",
                    "month": datetime(2024 + m // 12, 1 + m % 12, 1),
                    "pulse": float(level),
                    "trend": drift,
                    "noise": rng.uniform(0, 1),
                }
            )
    return add_targets(pl.DataFrame(rows).sort("company_id", "month"))


def test_far_horizons_keep_moving_with_the_production_huber_threshold():
    """Guards the Huber ``alpha``: with LightGBM's default (0.9) every gradient is clipped
    and the forecast freezes past +3 (a flat line); on a rising company +6 must sit
    clearly above +3."""
    frame = _drift_frame()
    params = {**FAST_PARAMS, "alpha": POINT_PARAMS["alpha"]}
    out = ForecastEngine.fit(frame, params, rounds=60).predict(frame)
    deltas = out.pivot(on="horizon", index="company_id", values="delta").join(
        frame.group_by("company_id").agg(pl.col("trend").first()), on="company_id"
    )
    rising = deltas.filter(pl.col("trend") > 1)
    assert len(rising) >= 5
    assert ((rising["6"] - rising["3"]) > 2).all()


def test_inflow_growth_is_finite_without_inflows():
    months = [datetime(2025, m, 1) for m in range(1, 8)]
    df = pl.DataFrame(
        {
            "company_id": ["C"] * 7,
            "month": months,
            "inflow": [100.0, 100.0, 100.0, 0.0, 0.0, 0.0, 50.0],
            "inflow_intra": [0.0] * 7,
            "outflow": [10.0] * 7,
            "outflow_3m": [30.0] * 7,
            "ev_returned": [0] * 7,
            "ev_stress": [0] * 7,
            "service_3m": [0.0] * 7,
            "loc_util": [0.0] * 7,
            "dpo_days": [None] * 7,
            "cash_end": [1000.0] * 7,
        }
    )
    growth = flow_dynamics(df)["inflow_growth_3m"]
    assert growth.is_finite().all()
    assert growth[5] < 0
