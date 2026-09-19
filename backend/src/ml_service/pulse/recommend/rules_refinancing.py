"""Rule for restructuring maturities that overwhelm the cash position."""

from __future__ import annotations

from ml_service.pulse.recommend import config as cfg
from ml_service.pulse.recommend.rules_common import (
    Assessment,
    block,
    cash_days_reason,
    confidence_gate,
    contra,
    pct,
    pro,
    pulse_gate,
    trend_reason,
)
from ml_service.pulse.recommend.snapshot import CompanySnapshot

MIN_PULSE_REFINANCING = 15.0


def refinancing(s: CompanySnapshot) -> Assessment:
    """Consolidate maturities when six months of debt service overwhelm the cash position."""
    a = Assessment("refinancing")
    if s.holdings.loan_outstanding <= 0 and s.service_3m <= 0:
        return a.add(block("sin_deuda", "No tienes deuda viva que reestructurar."))
    a.add(confidence_gate(s)).add(
        pulse_gate(s, MIN_PULSE_REFINANCING, "tension_extrema")
    )
    mat = s.raw("maturities")
    if mat is None:
        return a.add(
            block("sin_caja", "No podemos medir tus vencimientos frente a tu caja.")
        )
    if mat >= cfg.SEVERE_MATURITY_RATIO:
        a.add(
            pro(
                "vencimientos_severos",
                f"Los vencimientos de seis meses son {mat:.1f} veces tu caja (más de {cfg.SEVERE_MATURITY_RATIO:.0f}).",
                50,
                variable="maturities",
                value=mat,
                unit="x caja",
            )
        )
    elif mat >= cfg.HIGH_MATURITY_RATIO:
        a.add(
            pro(
                "vencimientos_altos",
                f"Los vencimientos de seis meses son {mat:.1f} veces tu caja (más de {cfg.HIGH_MATURITY_RATIO:.0f}).",
                35,
                variable="maturities",
                value=mat,
                unit="x caja",
            )
        )
    elif mat < 0.5:
        a.add(
            contra(
                "vencimientos_asumibles",
                f"Los vencimientos de seis meses son {mat:.2f} veces tu caja: tu deuda actual es asumible.",
                30,
                variable="maturities",
                value=mat,
                unit="x caja",
            )
        )
    a.add(cash_days_reason(s, low_points=15, high_points=-15))
    util = s.raw("loc_util")
    if util is not None and util >= cfg.UTIL_HIGH:
        a.add(
            pro(
                "linea_financia_deuda",
                f"Tu línea está al {pct(util)}: el corto plazo ya está financiando vencimientos.",
                10,
                variable="loc_util",
                value=util,
                unit="% del límite",
            )
        )
    if s.holdings.current_rate is not None:
        a.add(
            pro(
                "tipo_actual",
                f"Tus préstamos actuales están al {pct(s.holdings.current_rate, 2)}: la comparación con el nuevo tipo está más abajo.",
                0,
                value=s.holdings.current_rate,
                unit="tipo anual",
            )
        )
    return a.add(trend_reason(s, when_declining=10, when_improving=-5))
