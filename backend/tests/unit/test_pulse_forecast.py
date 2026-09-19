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
from ml_service.pulse.forecast.config import HORIZONS
from ml_service.pulse.forecast.engine import ForecastEngine
from ml_service.pulse.forecast.features import add_targets, feature_columns
from ml_service.pulse.score import Calibration
from ml_service.pulse.variables import VARIABLES

FAST_PARAMS = {
    "objective": "huber",
    "learning_rate": 0.1,
    "num_leaves": 4,
    "min_data_in_leaf": 5,
    "verbose": -1,
}


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
    assert abs(sum(shares_of_feature("pulse_raw_d6").values()) - 1) < 1e-9


def test_aggregate_is_exact_decomposition():
    features = ["cash_days", "pillar_deuda", "pulse_raw", "inflow"]
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
            "pulse_raw": [float(10 * i) for i in range(8)],
        }
    )
    out = add_targets(df)
    assert out["y_1"].to_list()[:2] == [10.0, 10.0] and out["y_1"].to_list()[-1] is None
    assert out["y_6"].to_list()[0] == 60.0 and out["y_6"].null_count() == 6


def _synthetic_frame(n_companies: int = 30, n_months: int = 14) -> pl.DataFrame:
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
                    "pulse_raw": level,
                    "cash_days": rng.uniform(0, 365),
                    "pillar_liquidez": rng.uniform(0, 100),
                }
            )
    return add_targets(pl.DataFrame(rows).sort("company_id", "month"))


def test_engine_fits_predicts_and_decomposes():
    frame = _synthetic_frame()
    cal = Calibration().fit(frame["pulse_raw"].to_numpy())
    engine = ForecastEngine.fit(frame, cal, FAST_PARAMS)
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
    assert np.allclose(total, out["delta_raw"].to_numpy())
    assert "y_1" not in feature_columns(frame) and "group_id" not in feature_columns(
        frame
    )
