"""Price a product for a company: reference rate + margins the company can read line by line.

    spread = margen del producto + prima de riesgo (PD x LGD)
           + prima por incertidumbre de datos + ajuste por tendencia [+ utilización]
    rate   = tipo sin riesgo (Euríbor 12 m, or whatever the caller passes) + spread

The spread never depends on the reference rate, so a recommendation can be
re-quoted for any Euríbor by adding it back. For a deposit the same table is
read as a yield: Euríbor minus the bank's margin plus a bonus when the cash is
clearly stable. Final rates are floored at zero.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from ml_service.pulse.recommend import config as cfg
from ml_service.pulse.recommend.catalogue import Product
from ml_service.pulse.recommend.snapshot import CompanySnapshot

STRESS_TO_DEFAULT = 0.25
"""Share of companies in bank stress assumed to end in default (documented assumption)."""


@dataclass(frozen=True)
class Component:
    """One line of the price table, in basis points."""

    key: str
    label: str
    bps: int
    detail: str


@dataclass(frozen=True)
class Pricing:
    kind: str
    reference_rate: float
    annual_rate: float
    spread_bps: int
    """Total spread over the reference rate after clamping to the product band."""
    components: list[Component] = field(default_factory=list)
    clamped: bool = False
    annual_pd: float = 0.0
    expected_loss_bps: int = 0


def annualise(p6: float) -> float:
    """Six-month stress probability -> twelve-month probability."""
    return 1.0 - (1.0 - p6) ** 2


def risk_premium(p6: float, lgd: float) -> tuple[int, float]:
    """(premium in bps, annual PD) from the stress probability and the product's LGD."""
    pd12 = annualise(p6)
    bps = round(pd12 * STRESS_TO_DEFAULT * lgd * 10_000)
    return min(bps, cfg.MAX_RISK_PREMIUM_BPS), pd12


def _trend(s: CompanySnapshot) -> Component | None:
    delta = s.forecast_delta
    if delta is None:
        return None
    if delta <= cfg.TREND_DECLINE_POINTS:
        return Component(
            "tendencia",
            "Ajuste por tendencia",
            cfg.TREND_DECLINE_BPS,
            f"Prevemos una caída de {abs(delta):.0f} puntos de PULSE a seis meses.",
        )
    if delta >= cfg.TREND_IMPROVE_POINTS:
        return Component(
            "tendencia",
            "Ajuste por tendencia",
            cfg.TREND_IMPROVE_BPS,
            f"Prevemos una mejora de {delta:.0f} puntos de PULSE a seis meses.",
        )
    return None


def _cost_components(
    product: Product, s: CompanySnapshot, p6: float
) -> tuple[list[Component], float]:
    premium, pd12 = risk_premium(p6, product.lgd)
    uncertainty = round(cfg.MAX_DATA_UNCERTAINTY_BPS * (1.0 - s.confidence))
    parts = [
        Component(
            "margen_producto",
            "Margen del producto",
            product.base_spread_bps,
            f"Margen base de {product.label_es.lower()} para una empresa sin riesgo esperado.",
        ),
        Component(
            "prima_riesgo",
            "Prima de riesgo",
            premium,
            f"Probabilidad de tensión a 6 meses {p6:.0%} (anualizada {pd12:.0%}) × {STRESS_TO_DEFAULT:.0%} que acaba en impago × {product.lgd:.0%} de pérdida en ese caso.",
        ),
        Component(
            "incertidumbre_datos",
            "Prima por incertidumbre de datos",
            uncertainty,
            f"El {s.confidence:.0%} de tu PULSE está respaldado por datos; hasta {cfg.MAX_DATA_UNCERTAINTY_BPS} pb si no hubiera ninguno.",
        ),
    ]
    trend = _trend(s)
    if trend:
        parts.append(trend)
    util = s.raw("loc_util")
    if (
        product.family == "circulante"
        and util is not None
        and util >= cfg.HIGH_UTILISATION
    ):
        parts.append(
            Component(
                "utilizacion",
                "Ajuste por utilización",
                cfg.HIGH_UTILISATION_BPS,
                f"Tu línea actual está al {util:.0%}: la nueva se usará intensamente.",
            )
        )
    return parts, pd12


def _yield_components(s: CompanySnapshot) -> list[Component]:
    parts = [
        Component(
            "margen_banco",
            "Margen del banco",
            -60,
            "Diferencia habitual entre el interbancario y un depósito a plazo de empresa.",
        ),
    ]
    cd = s.raw("cash_days") or 0.0
    if cd >= cfg.STICKY_CASH_DAYS:
        parts.append(
            Component(
                "estabilidad",
                "Bonus por estabilidad",
                cfg.DEPOSIT_STICKY_BONUS_BPS,
                f"Tu caja cubre {cd:.0f} días: el banco puede contar con ella.",
            )
        )
    return parts


def reference_component(reference_rate: float) -> Component:
    """The risk-free line of the price table."""
    return Component(
        "referencia",
        cfg.REFERENCE_RATE_LABEL,
        round(reference_rate * 10_000),
        "Tipo sin riesgo de referencia; el resto de líneas son el diferencial sobre él.",
    )


def price(
    product: Product,
    s: CompanySnapshot,
    p_stress_6m: float,
    reference_rate: float = cfg.EURIBOR_12M,
) -> Pricing:
    """Price ``product`` for the company over ``reference_rate``.

    ``p_stress_6m`` comes from the risk model. The spread is computed first and
    clamped to the product band; the reference rate is only added at the end.
    """
    if product.rate_kind == "yield":
        parts, pd12, premium = _yield_components(s), 0.0, 0
    else:
        parts, pd12 = _cost_components(product, s, p_stress_6m)
        premium = next(c.bps for c in parts if c.key == "prima_riesgo")
    raw_spread = sum(c.bps for c in parts)
    spread = min(max(raw_spread, product.min_spread_bps), product.max_spread_bps)
    rate = max(reference_rate + spread / 10_000, 0.0)
    return Pricing(
        kind=product.rate_kind,
        reference_rate=round(reference_rate, 6),
        annual_rate=round(rate, 4),
        spread_bps=spread,
        components=[reference_component(reference_rate), *parts],
        clamped=spread != raw_spread,
        annual_pd=round(pd12, 4),
        expected_loss_bps=premium,
    )
