"""Unit tests for the SHAP explanation layer (small synthetic frames, no disk)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

import lightgbm as lgb
import numpy as np
import polars as pl
import pytest

from ml_service.xray.config import FEATURE_SPECS
from ml_service.xray.explain import explain_change, explain_rows, top_reasons
from ml_service.xray.explain.attribution import (
    SHAP_SUFFIX,
    level_points,
    shap_feature_names,
)
from ml_service.xray.explain.format_es import format_pair, month_label, points_phrase
from ml_service.xray.explain.narrative import waterfall
from ml_service.xray.explain.regime_es import regime_text_es
from ml_service.xray.score.composite import composite_score, pillar_scores
from ml_service.xray.score.model import MODEL_FEATURES
from ml_service.xray.score.scoring import W_LEVEL

N_ROWS = 120
NAMES = [spec.name for spec in FEATURE_SPECS]


@dataclass
class FakeModels:
    """Stand-in for :class:`ForwardModels` holding two tiny boosters."""

    stress: lgb.Booster
    future: lgb.Booster


@dataclass
class FakeEngine:
    """Minimal engine surface used by :func:`explain_rows`."""

    models: FakeModels


def synthetic_panel(n: int = N_ROWS, seed: int = 7) -> pl.DataFrame:
    """Company-month rows with raw values, normalised signals, pillars and composite."""
    rng = np.random.default_rng(seed)
    raw = {name: rng.normal(size=n) for name in NAMES}
    norm = {f"{name}__norm": rng.uniform(0.05, 0.95, size=n) for name in NAMES}
    known = {f"{name}__known": np.ones(n, dtype=bool) for name in NAMES}
    frame = pl.DataFrame(
        {
            "company_id": ["COMP_A"] * (n // 2) + ["COMP_B"] * (n - n // 2),
            "month": [
                datetime(2025 + (i % 24) // 12, (i % 12) + 1, 1) for i in range(n)
            ],
            "months_observed": np.arange(n) % 24 + 1,
            "score": 50 + rng.normal(scale=8, size=n),
            "regime": ["steady"] * n,
            "regime_shift": np.zeros(n),
            "changepoint_month": [None] * n,
            **raw,
            **norm,
            **known,
        }
    )
    return composite_score(pillar_scores(frame))


def fake_engine(frame: pl.DataFrame, seed: int = 3) -> FakeEngine:
    """Two five-round boosters trained on the synthetic frame, enough for TreeSHAP."""
    rng = np.random.default_rng(seed)
    x = frame.select(MODEL_FEATURES).to_numpy().astype(float)
    params = {"verbose": -1, "num_leaves": 4, "min_child_samples": 5, "seed": seed}
    stress = lgb.train(
        {**params, "objective": "binary"},
        lgb.Dataset(x, (rng.uniform(size=x.shape[0]) < 0.3).astype(int)),
        5,
    )
    future = lgb.train(
        {**params, "objective": "regression"},
        lgb.Dataset(x, frame["composite"].to_numpy()),
        5,
    )
    return FakeEngine(models=FakeModels(stress=stress, future=future))


@pytest.fixture
def explained() -> pl.DataFrame:
    """Synthetic panel with attribution columns."""
    frame = synthetic_panel()
    return explain_rows(fake_engine(frame), frame)


def test_shap_feature_names_cover_specs_and_tenure() -> None:
    names = shap_feature_names()
    assert len(names) == len(FEATURE_SPECS) + 1
    assert names[-1] == "months_observed"


def test_explain_rows_adds_one_finite_column_per_feature(
    explained: pl.DataFrame,
) -> None:
    columns = [f"{name}{SHAP_SUFFIX}" for name in shap_feature_names()]
    assert all(column in explained.columns for column in columns)
    values = explained.select(columns).to_numpy()
    assert np.isfinite(values).all()


def test_level_points_reconstruct_the_composite_term() -> None:
    frame = synthetic_panel(n=20, seed=11)
    known = np.ones((20, len(NAMES)))
    dev = frame.select([f"{n}__norm" for n in NAMES]).to_numpy() - 0.5
    total = level_points(dev, known).sum(axis=1)
    expected = W_LEVEL * (frame["composite"].to_numpy() - 50.0)
    assert np.allclose(total, expected, atol=1e-8)


def test_level_points_ignore_unknown_features() -> None:
    frame = synthetic_panel(n=5, seed=2)
    dev = frame.select([f"{n}__norm" for n in NAMES]).to_numpy() - 0.5
    known = np.ones_like(dev)
    known[:, 0] = 0.0
    contributions = level_points(dev * known, known)
    assert np.allclose(contributions[:, 0], 0.0)


def test_top_reasons_shape_and_ordering(explained: pl.DataFrame) -> None:
    row = explained.to_dicts()[0]
    reasons = top_reasons(row, k=3)
    assert 0 < len(reasons) <= 6
    assert set(reasons[0]) == {"feature", "label", "pillar", "impact", "value"}
    negative = [r["impact"] for r in reasons if r["impact"] < 0]
    positive = [r["impact"] for r in reasons if r["impact"] > 0]
    assert negative == sorted(negative)
    assert positive == sorted(positive, reverse=True)


def test_top_reasons_skips_unknown_features(explained: pl.DataFrame) -> None:
    row = dict(explained.to_dicts()[0])
    hidden = NAMES[0]
    row[f"{hidden}__known"] = False
    assert all(reason["feature"] != hidden for reason in top_reasons(row, k=28))


def test_waterfall_reports_before_and_after_values(explained: pl.DataFrame) -> None:
    rows = explained.filter(pl.col("company_id") == "COMP_A").sort("month").to_dicts()
    moves = waterfall(rows[0], rows[-1])
    assert moves, "random features must move something"
    deltas = [abs(m["delta_points"]) for m in moves]
    assert deltas == sorted(deltas, reverse=True)
    assert {"feature", "label", "delta_points", "value_before", "value_after"} <= set(
        moves[0]
    )


def test_explain_change_returns_a_spanish_narrative(explained: pl.DataFrame) -> None:
    series = explained.filter(pl.col("company_id") == "COMP_A").sort("month")
    change = explain_change(series)
    assert change["month"] == series["month"][-1].strftime("%Y-%m")
    assert change["window_months"] == 6
    assert "score" in change["narrative_es"]
    assert change["regime_text_es"].startswith("Sin cambio de régimen")
    assert isinstance(change["waterfall"], list)


def test_explain_change_handles_a_single_month(explained: pl.DataFrame) -> None:
    change = explain_change(explained.head(1))
    assert change["window_months"] == 0
    assert change["waterfall"] == []
    assert change["narrative_1m_es"] is None


def test_explain_change_rejects_an_empty_series() -> None:
    with pytest.raises(ValueError, match="at least one scored month"):
        explain_change([])


def test_regime_text_distinguishes_dip_from_decline() -> None:
    dip = regime_text_es({"regime": "transient_dip", "regime_shift": -11.0})
    fall = regime_text_es(
        {
            "regime": "structural_decline",
            "regime_shift": -14.0,
            "changepoint_month": datetime(2026, 3, 1),
        }
    )
    assert "Bache puntual" in dip
    assert "ya ha vuelto" in dip or "vuelto a su nivel" in dip
    assert "Caída estructural" in fall
    assert "marzo de 2026" in fall


def test_spanish_formatting_helpers() -> None:
    assert format_pair("dso_days", 41, 58) == "41→58 días"
    assert format_pair("payables_overdue_share", 0.1, 0.3) == "10→30%"
    assert format_pair("cash_runway_months", 2.0, 0.5) == "2.0→0.5 meses"
    assert points_phrase(-1.0) == "1 punto"
    assert points_phrase(-7.4) == "7 puntos"
    assert month_label("2026-03") == "marzo de 2026"


def test_top_reasons_fall_back_to_normalised_deviation() -> None:
    """Callers that never ran explain_rows still get usable reason codes."""
    row = synthetic_panel(n=1, seed=5).to_dicts()[0]
    reasons = top_reasons(row, k=2)
    assert len(reasons) == 4
    assert all(r["impact"] != 0 for r in reasons)
