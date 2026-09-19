"""What would move the price: counterfactuals on the risk model plus the weakest variables behind them."""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from ml_service.pulse.recommend.catalogue import Product
from ml_service.pulse.recommend.pricing import risk_premium
from ml_service.pulse.recommend.risk import (
    FEATURES,
    LABELS_ES,
    RiskModel,
    snapshot_features,
)
from ml_service.pulse.recommend.snapshot import CompanySnapshot
from ml_service.pulse.variables import VARIABLES

TARGET_PILLAR = 60.0
MAX_LEVERS = 3
WEAK_VARIABLE = 45.0
PILLAR_LABELS = {
    "pillar_liquidez": "liquidez",
    "pillar_deuda": "deuda y servicio",
    "pillar_pago": "comportamiento de pago",
    "pillar_cobro": "calidad de cobro",
}


@dataclass(frozen=True)
class Lever:
    """One improvement the company controls and its effect on the risk premium."""

    pillar: str
    label: str
    current: float
    target: float
    p_stress_now: float
    p_stress_then: float
    premium_saving_bps: int
    variables: list[dict] = field(default_factory=list)


def _weak_variables(s: CompanySnapshot, pillar: str) -> list[dict]:
    """Known variables of ``pillar`` scoring below ``WEAK_VARIABLE``, weakest first."""
    rows = []
    for v in VARIABLES:
        if v.pillar != pillar:
            continue
        reading = s.variables.get(v.key)
        if reading is None or not reading.known or reading.score is None:
            continue
        if reading.score < WEAK_VARIABLE:
            rows.append(
                {
                    "key": v.key,
                    "label": v.label_es,
                    "score": round(reading.score, 1),
                    "raw": reading.raw,
                    "weight": v.weight,
                }
            )
    return sorted(rows, key=lambda r: (r["score"], -r["weight"]))


def levers(model: RiskModel, product: Product, s: CompanySnapshot) -> list[Lever]:
    """Pillars below ``TARGET_PILLAR`` whose improvement would cut the premium (zero-effect ones are dropped)."""
    if product.rate_kind != "cost":
        return []
    x = snapshot_features(s)
    p_now = model.probability(x)
    premium_now, _ = risk_premium(p_now, product.lgd)
    out: list[Lever] = []
    for idx, feature in enumerate(FEATURES):
        if feature not in PILLAR_LABELS or x[idx] >= TARGET_PILLAR:
            continue
        pillar = feature.removeprefix("pillar_")
        if s.pillars.get(pillar) is None:
            continue  # unknown pillar: nothing the company can move yet
        alt = np.array(x, copy=True)
        alt[idx] = TARGET_PILLAR
        p_then = model.probability(alt)
        premium_then, _ = risk_premium(p_then, product.lgd)
        out.append(
            Lever(
                pillar=pillar,
                label=LABELS_ES[feature],
                current=round(float(x[idx]), 1),
                target=TARGET_PILLAR,
                p_stress_now=round(p_now, 4),
                p_stress_then=round(p_then, 4),
                premium_saving_bps=max(premium_now - premium_then, 0),
                variables=_weak_variables(s, pillar),
            )
        )
    out = [lv for lv in out if lv.premium_saving_bps > 0]
    out.sort(key=lambda lv: -lv.premium_saving_bps)
    return out[:MAX_LEVERS]
