"""Unit tests for the quantile normaliser."""

from __future__ import annotations

import numpy as np
import polars as pl
import pytest

from ml_service.xray.config import FEATURE_SPECS
from ml_service.xray.score.normalize import QuantileNormalizer, _mid_rank

N = 100


def _panel(**overrides) -> pl.DataFrame:
    """Panel with every declared feature, defaulting to a 0..N-1 ramp."""
    data = {s.name: np.arange(N, dtype=float) for s in FEATURE_SPECS}
    data.update(overrides)
    return pl.DataFrame(data)


def test_mid_rank_puts_a_plateau_in_its_middle():
    """A value sitting on a long plateau maps to the middle of that plateau."""
    grid = np.array([0.0] * 90 + list(np.linspace(0.1, 1.0, 10)))
    assert _mid_rank(np.array([0.0]), grid)[0] == pytest.approx(0.45, abs=0.01)


def test_direction_is_flipped_for_negative_features():
    """Higher is healthier after normalisation, whatever the raw direction."""
    normed = QuantileNormalizer().fit(_panel()).transform(_panel())
    up = normed["cash_runway_months__norm"].to_numpy()
    down = normed["neg_balance_share__norm"].to_numpy()
    assert up[0] < up[-1]
    assert down[0] > down[-1]
    assert up.min() >= 0.0 and up.max() <= 1.0


def test_zero_heavy_feature_reads_as_typical_not_perfect():
    """Ninety per cent of zeros must not hand every quiet company a perfect mark."""
    values = np.array([0.0] * 90 + [1.0] * 10)
    panel = _panel(returned_debit_rate=values)
    normed = QuantileNormalizer().fit(panel).transform(panel)
    out = normed["returned_debit_rate__norm"].to_numpy()
    assert 0.4 < out[0] < 0.7
    assert out[-1] < out[0]


def test_unknown_values_become_neutral_and_are_flagged():
    """Missing inputs score 0.5 and are marked as unknown."""
    values = np.arange(N, dtype=float)
    values[5] = np.nan
    panel = _panel(dso_days=values)
    normed = QuantileNormalizer().fit(panel).transform(panel)
    assert normed["dso_days__norm"][5] == 0.5
    assert normed["dso_days__known"][5] is False
    assert normed["dso_days__known"][4] is True


def test_grid_falls_back_when_too_few_observations():
    """A feature with almost no data gets a trivial grid instead of crashing."""
    panel = _panel(leverage_ratio=[float("nan")] * (N - 3) + [1.0, 2.0, 3.0])
    normalizer = QuantileNormalizer().fit(panel)
    assert normalizer.grid["leverage_ratio"] == [0.0, 1.0]


def test_save_and_load_roundtrip(tmp_path):
    """A persisted normaliser transforms exactly like the original."""
    panel = _panel()
    normalizer = QuantileNormalizer().fit(panel)
    path = tmp_path / "normalizer.json"
    normalizer.save(path)
    restored = QuantileNormalizer.load(path)
    a = normalizer.transform(panel)["net_margin__norm"].to_list()
    b = restored.transform(panel)["net_margin__norm"].to_list()
    assert a == b
