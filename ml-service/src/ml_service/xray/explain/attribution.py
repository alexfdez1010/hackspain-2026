"""TreeSHAP attribution of the X-Ray score into per-feature score points.

The final score blends three terms (see :mod:`ml_service.xray.score.scoring`)::

    score_raw = W_LEVEL * composite
              + W_FORWARD * pred_future_composite
              + W_STRESS * pdo(p_stress)

Each term is attributed to the 28 panel features:

* **level** - ``composite`` is an exact weighted mean of the normalised
  features, so its contribution is split analytically, baselined at the
  neutral composite of 50 points.
* **forward** - TreeSHAP on the regression booster, already in composite
  points, scaled by ``W_FORWARD``.
* **stress** - TreeSHAP on the binary booster lives in log-odds; the scorecard
  maps log-odds to points with ``factor = 12 / ln 2`` and a *negative* sign
  (higher stress odds means fewer points), so the contribution is
  ``-W_STRESS * factor * phi``.

The boosters also consume ``composite`` and ``pillar_*`` columns. Their SHAP is
folded back onto the member features: a block's SHAP is shared out among the
features whose weighted deviation from neutral (``weight * (norm - 0.5)``)
points in the same direction as that SHAP, so a negative pillar contribution is
blamed on the features that are actually below par. When every member feature
sits at neutral the split falls back to plain weights. Positive attributions
always mean "this makes the company healthier".
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import numpy as np
import polars as pl
import shap

from ml_service.xray.config import FEATURE_SPECS, PILLARS
from ml_service.xray.score.composite import FEATURE_WEIGHTS, PILLAR_WEIGHTS
from ml_service.xray.score.model import MODEL_FEATURES
from ml_service.xray.score.scoring import W_FORWARD, W_LEVEL, W_STRESS

if TYPE_CHECKING:  # pragma: no cover - typing only
    import lightgbm as lgb

    from ml_service.xray.score.pipeline import ScoreEngine

SHAP_SUFFIX = "__shap"
PDO_FACTOR = 12.0 / np.log(2.0)
NEUTRAL = 0.5
EPS = 1e-9

FEATURE_NAMES: tuple[str, ...] = tuple(s.name for s in FEATURE_SPECS)
EXTRA_NAMES: tuple[str, ...] = ("months_observed",)
_WEIGHTS = np.array([FEATURE_WEIGHTS.get(n, 1.0) for n in FEATURE_NAMES])
_PILLAR_IDX = {
    p: np.array([i for i, s in enumerate(FEATURE_SPECS) if s.pillar == p])
    for p in PILLARS
}
_COL = {name: i for i, name in enumerate(MODEL_FEATURES)}


def shap_feature_names() -> tuple[str, ...]:
    """Names that get a ``<name>__shap`` column (28 features + months_observed)."""
    return FEATURE_NAMES + EXTRA_NAMES


def _tree_shap(booster: lgb.Booster, x: np.ndarray) -> np.ndarray:
    """TreeSHAP values in the booster's raw output space, shaped ``(n, n_features)``."""
    arr = np.asarray(shap.TreeExplainer(booster).shap_values(x))
    if arr.ndim == 3:
        arr = arr[-1] if arr.shape[0] == 2 else arr[..., -1]
    return arr[:, : x.shape[1]]


def _deviation(rows: pl.DataFrame) -> tuple[np.ndarray, np.ndarray]:
    """Signed distance from neutral of every normalised feature plus its known mask."""
    known = rows.select([f"{n}__known" for n in FEATURE_NAMES]).to_numpy().astype(float)
    dev = rows.select([f"{n}__norm" for n in FEATURE_NAMES]).to_numpy().astype(float)
    return (dev - NEUTRAL) * known, known


def _shares(
    weights: np.ndarray, dev: np.ndarray, known: np.ndarray, block: np.ndarray
) -> np.ndarray:
    """Split one aggregate contribution across the features that caused it.

    A block (a pillar, or the composite) is a weighted mean of the normalised
    features. When its SHAP is negative the blame belongs to the features that
    sit *below* neutral, and vice versa, so only the features aligned with the
    block's sign take a share (rows sum to 1). If no feature is aligned - all of
    them neutral - the split falls back to plain weights.
    """
    aligned = np.maximum(weights * dev * np.sign(block), 0.0)
    den = aligned.sum(axis=1, keepdims=True)
    fallback = weights * known
    fb_den = fallback.sum(axis=1, keepdims=True)
    use_dev = den > EPS
    return np.where(
        use_dev,
        aligned / np.where(use_dev, den, 1.0),
        fallback / np.where(fb_den > EPS, fb_den, 1.0),
    )


def _fold_blocks(points: np.ndarray, dev: np.ndarray, known: np.ndarray) -> np.ndarray:
    """Per-feature points, with ``pillar_*``/``composite`` SHAP folded back in."""
    acc = np.column_stack([points[:, _COL[n]] for n in FEATURE_NAMES])
    for pillar, idx in _PILLAR_IDX.items():
        block = points[:, _COL[f"pillar_{pillar}"], None]
        acc[:, idx] += block * _shares(_WEIGHTS[idx], dev[:, idx], known[:, idx], block)
    combined = np.array(
        [_WEIGHTS[i] * PILLAR_WEIGHTS[s.pillar] for i, s in enumerate(FEATURE_SPECS)]
    )
    block = points[:, _COL["composite"], None]
    acc += block * _shares(combined, dev, known, block)
    return acc


def level_points(dev: np.ndarray, known: np.ndarray) -> np.ndarray:
    """Exact split of ``W_LEVEL * (composite - 50)`` across the known features."""
    share = np.zeros_like(dev)
    pillar_known = np.zeros((dev.shape[0], len(PILLARS)))
    for j, pillar in enumerate(PILLARS):
        idx = _PILLAR_IDX[pillar]
        den = (_WEIGHTS[idx] * known[:, idx]).sum(axis=1)
        pillar_known[:, j] = (den > 0).astype(float)
        share[:, idx] = (
            _WEIGHTS[idx] * known[:, idx] / np.where(den > 0, den, 1.0)[:, None]
        )
    pillar_w = np.array([PILLAR_WEIGHTS[p] for p in PILLARS]) * pillar_known
    total = pillar_w.sum(axis=1)
    pillar_w = pillar_w / np.where(total > 0, total, 1.0)[:, None]
    for j, pillar in enumerate(PILLARS):
        idx = _PILLAR_IDX[pillar]
        share[:, idx] *= pillar_w[:, j, None]
    return W_LEVEL * 100.0 * share * dev


def explain_rows(engine: ScoreEngine, scored_rows: pl.DataFrame) -> pl.DataFrame:
    """Append one ``<feature>__shap`` column per feature, expressed in score points.

    Args:
        engine: Fitted engine holding the two forward boosters.
        scored_rows: Rows of the scored panel (needs the model features plus the
            ``<feature>__norm``/``<feature>__known`` columns).

    Returns:
        The same frame with 29 extra attribution columns. Positive means the
        feature pushes the score up; the sum approximates ``score_raw`` minus a
        constant baseline (calibration and EWMA smoothing are applied afterwards
        by the scoring stage and are not attributable to single features).
    """
    x = scored_rows.select(MODEL_FEATURES).to_numpy().astype(float)
    points = W_FORWARD * _tree_shap(engine.models.future, x) - (
        W_STRESS * PDO_FACTOR * _tree_shap(engine.models.stress, x)
    )
    dev, known = _deviation(scored_rows)
    acc = _fold_blocks(points, dev, known) + level_points(dev, known)
    cols = [
        pl.Series(f"{n}{SHAP_SUFFIX}", acc[:, i]) for i, n in enumerate(FEATURE_NAMES)
    ]
    cols.append(
        pl.Series(f"months_observed{SHAP_SUFFIX}", points[:, _COL["months_observed"]])
    )
    return scored_rows.with_columns(cols)
