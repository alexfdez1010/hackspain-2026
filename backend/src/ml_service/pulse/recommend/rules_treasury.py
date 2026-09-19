"""Rule for the treasury deposit: remunerate cash the company will not need."""

from __future__ import annotations

from ml_service.pulse.recommend import config as cfg
from ml_service.pulse.recommend.rules_common import (
    Assessment,
    block,
    days,
    eur,
    pro,
    trend_reason,
)
from ml_service.pulse.recommend.snapshot import CompanySnapshot


def treasury_deposit(s: CompanySnapshot) -> Assessment:
    """Remunerate cash the company will not need in the coming months."""
    a = Assessment("treasury_deposit")
    cd, ratio, mat = s.raw("cash_days"), s.raw("cash_min"), s.raw("maturities")
    if cd is None or s.cash_end is None:
        return a.add(block("sin_caja", "No podemos reconstruir tu saldo de caja."))
    if cd < cfg.EXCESS_CASH_DAYS:
        a.add(
            block(
                "sin_excedente",
                f"Tu caja cubre {days(cd)} de pagos, por debajo de los {cfg.EXCESS_CASH_DAYS:.0f} que consideramos excedente.",
            )
        )
    if ratio is not None and ratio < 1.0:
        a.add(
            block(
                "picos_intramensuales",
                f"Dentro del mes tu caja llega a bajar a {ratio:.2f} meses de salidas: ese dinero no está ocioso.",
            )
        )
    if mat is not None and mat >= cfg.HIGH_MATURITY_RATIO:
        a.add(
            block(
                "vencimientos_cercanos",
                f"Los vencimientos de deuda de seis meses suponen {mat:.1f} veces tu caja.",
            )
        )
    excess = s.cash_end - cfg.DEPOSIT_KEEP_DAYS * s.monthly_outflow / 30.0
    if excess < cfg.MIN_EXCESS_CASH_EUR:
        a.add(
            block(
                "excedente_pequeno",
                f"Tras reservar {cfg.DEPOSIT_KEEP_DAYS:.0f} días de pagos quedan {eur(max(excess, 0))}, por debajo de {eur(cfg.MIN_EXCESS_CASH_EUR)}.",
            )
        )
    a.add(
        pro(
            "caja_excedente",
            f"Tu caja cubre {days(cd)} de pagos operativos.",
            min(40.0, cd / 10.0),
            variable="cash_days",
            value=cd,
            unit="días",
        )
    )
    if ratio is not None and ratio >= 2.0:
        a.add(
            pro(
                "minimo_holgado",
                f"Ni en el peor día del mes bajas de {ratio:.1f} meses de salidas.",
                20,
                variable="cash_min",
                value=ratio,
                unit="x salidas mensuales",
            )
        )
    if s.holdings.loan_outstanding == 0 and s.service_3m == 0:
        a.add(
            pro("sin_deuda", "No tienes deuda viva que atender con ese excedente.", 10)
        )
    return a.add(trend_reason(s, when_declining=-15, when_improving=10))
