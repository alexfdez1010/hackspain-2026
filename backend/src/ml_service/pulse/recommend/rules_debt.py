"""Rules for the term products: investment loan and restructuring of maturities."""

from __future__ import annotations

from ml_service.pulse.recommend import config as cfg
from ml_service.pulse.recommend.rules_common import (
    Assessment,
    block,
    confidence_gate,
    contra,
    eur,
    pct,
    pro,
    pulse_gate,
    trend_reason,
)
from ml_service.pulse.recommend.snapshot import CompanySnapshot

MIN_PULSE_REFINANCING = 15.0


def term_loan(s: CompanySnapshot) -> Assessment:
    """A term loan for healthy companies that can carry a fixed instalment."""
    a = Assessment("term_loan")
    a.add(confidence_gate(s)).add(pulse_gate(s, cfg.MIN_PULSE_INVESTMENT_LOAN))
    mat = s.raw("maturities")
    if mat is not None and mat >= cfg.HIGH_MATURITY_RATIO:
        a.add(
            block(
                "vencimientos_altos",
                f"Tus vencimientos de seis meses ya suponen {mat:.1f} veces tu caja: antes de nueva deuda hay que reordenar la actual.",
            )
        )
    if s.monthly_collections < cfg.MIN_OUTFLOW_EUR:
        a.add(
            block(
                "sin_cobros",
                f"Tus cobros bancarios ({eur(s.monthly_collections)} al mes) no permiten dimensionar una cuota.",
            )
        )
    if s.pulse >= 75:
        a.add(
            pro(
                "pulse_alto",
                f"Tu PULSE de {s.pulse:.0f} está en el cuartil más sano de la cartera.",
                20,
                value=s.pulse,
                unit="PULSE",
            )
        )
    cd = s.raw("cash_days")
    if cd is not None and cfg.LOW_CASH_DAYS <= cd <= cfg.EXCESS_CASH_DAYS:
        a.add(
            pro(
                "caja_equilibrada",
                f"Tu caja cubre {cd:.0f} días: suficiente para la cuota, sin excedentes ociosos.",
                10,
                variable="cash_days",
                value=cd,
                unit="días",
            )
        )
    elif cd is not None and cd > cfg.EXCESS_CASH_DAYS:
        a.add(
            contra(
                "caja_sobrada",
                f"Con {cd:.0f} días de caja puedes financiar la inversión con recursos propios.",
                20,
                variable="cash_days",
                value=cd,
                unit="días",
            )
        )
    util = s.raw("loc_util")
    if util is not None and util < cfg.UTIL_LOW:
        a.add(
            pro(
                "linea_libre",
                f"Solo usas el {pct(util)} de tu línea: no dependes del corto plazo.",
                5,
                variable="loc_util",
                value=util,
                unit="% del límite",
            )
        )
    if s.holdings.n_loans == 0:
        a.add(
            pro(
                "sin_prestamos",
                "No tienes préstamos vivos: la cuota entra en una estructura limpia.",
                5,
            )
        )
    return a.add(trend_reason(s, when_declining=-15, when_improving=10))
