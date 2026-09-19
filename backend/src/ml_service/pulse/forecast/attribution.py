"""Fold per-feature contributions into the 11 PULSE variables (+ context + base).

Features derived from a variable's components go to that variable. Pillar-level
features are split across the pillar's variables by weight; PULSE-level features
across all variables by weight. Everything else (flows, calendar, events, group)
is reported as ``contexto``; the model bias as ``base``. The parts sum exactly to
the predicted change.
"""

from __future__ import annotations

import numpy as np

from ml_service.pulse.variables import PILLARS, VARIABLES

CONTEXT = "contexto"
BASE = "base"
_COMPONENT_OWNER = {c.name: v.key for v in VARIABLES for c in v.components}
_COMPONENTS_LONGEST_FIRST = sorted(_COMPONENT_OWNER, key=len, reverse=True)
_PILLAR_SHARES = {
    p: {
        v.key: v.weight / sum(x.weight for x in VARIABLES if x.pillar == p)
        for v in VARIABLES
        if v.pillar == p
    }
    for p in PILLARS
}
_ALL_SHARES = {v.key: v.weight / 100.0 for v in VARIABLES}
_PULSE_FEATURES = ("pulse",)


def shares_of_feature(name: str) -> dict[str, float]:
    """How a feature's contribution is distributed over variable keys (or CONTEXT)."""
    if name.startswith("var_"):
        key = name[4:].split("__")[0]
        return {key: 1.0} if key in _ALL_SHARES else {CONTEXT: 1.0}
    for comp in _COMPONENTS_LONGEST_FIRST:
        if name == comp or name.startswith(comp + "_"):
            return {_COMPONENT_OWNER[comp]: 1.0}
    if name.startswith("pillar_"):
        pillar = name[7:].split("_")[0]
        return (
            dict(_PILLAR_SHARES[pillar]) if pillar in _PILLAR_SHARES else {CONTEXT: 1.0}
        )
    if name in _PULSE_FEATURES or name.startswith(
        tuple(f"{p}_" for p in _PULSE_FEATURES)
    ):
        return dict(_ALL_SHARES)
    return {CONTEXT: 1.0}


def aggregate(contrib: np.ndarray, features: list[str]) -> dict[str, np.ndarray]:
    """Map a (rows, n_features + 1) contribution matrix to {variable_key | contexto | base: (rows,)}."""
    keys = [v.key for v in VARIABLES] + [CONTEXT, BASE]
    out = {k: np.zeros(contrib.shape[0]) for k in keys}
    for j, name in enumerate(features):
        for key, share in shares_of_feature(name).items():
            out[key] += contrib[:, j] * share
    out[BASE] += contrib[:, -1]
    return out
