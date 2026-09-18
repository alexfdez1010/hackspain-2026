"""Unit tests for the pillar sub-scores and their composite."""

from __future__ import annotations

import polars as pl
import pytest

from ml_service.xray.config import FEATURE_SPECS, PILLARS
from ml_service.xray.score.composite import composite_score, pillar_scores


def _normed(norm: float = 0.5, known: bool = True, **overrides) -> pl.DataFrame:
    """One row with every ``__norm`` / ``__known`` column the composite needs."""
    data: dict[str, list] = {}
    for spec in FEATURE_SPECS:
        data[f"{spec.name}__norm"] = [overrides.get(spec.name, norm)]
        data[f"{spec.name}__known"] = [overrides.get(f"{spec.name}__known", known)]
    return pl.DataFrame(data)


def test_neutral_inputs_give_a_neutral_score():
    """All-percentile-50 inputs produce a 50/100 composite."""
    out = composite_score(pillar_scores(_normed()))
    for pillar in PILLARS:
        assert out[f"pillar_{pillar}"][0] == pytest.approx(50.0)
    assert out["composite"][0] == pytest.approx(50.0)


def test_pillars_scale_to_zero_and_one_hundred():
    """A perfect and a worst-case company hit the ends of the range."""
    best = composite_score(pillar_scores(_normed(norm=1.0)))
    worst = composite_score(pillar_scores(_normed(norm=0.0)))
    assert best["composite"][0] == pytest.approx(100.0)
    assert worst["composite"][0] == pytest.approx(0.0)


def test_unknown_features_are_excluded_from_their_pillar():
    """A feature without data neither helps nor hurts its pillar."""
    out = pillar_scores(
        _normed(
            cash_runway_months=0.0,
            cash_runway_months__known=False,
        )
    )
    assert out["pillar_liquidity"][0] == pytest.approx(50.0)
    assert out["pillar_liquidity__known"][0] is True


def test_pillar_without_any_data_is_null_and_ignored():
    """A pillar with no known feature is null and drops out of the composite."""
    overrides = {f"{s.name}__known": False for s in FEATURE_SPECS if s.pillar == "debt"}
    out = composite_score(pillar_scores(_normed(**overrides)))
    assert out["pillar_debt"][0] is None
    assert out["pillar_debt__known"][0] is False
    assert out["composite"][0] == pytest.approx(50.0)


def test_heavier_features_move_their_pillar_more():
    """A feature with a bigger weight shifts its pillar further."""
    heavy = pillar_scores(_normed(neg_balance_share=1.0))["pillar_liquidity"][0]
    light = pillar_scores(_normed(cash_to_inflow=1.0))["pillar_liquidity"][0]
    assert heavy > light > 50.0
