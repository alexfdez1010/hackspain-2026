"""Rule for confirming: the bank pays the suppliers of a solid company with short terms."""

from __future__ import annotations

from ml_service.pulse.recommend import config as cfg
from ml_service.pulse.recommend.rules_common import (
    Assessment,
    already_holds,
    block,
    cash_days_reason,
    confidence_gate,
    contra,
    days,
    eur,
    pro,
    pulse_gate,
)
from ml_service.pulse.recommend.snapshot import CompanySnapshot


def confirming(s: CompanySnapshot) -> Assessment:
    """Pay suppliers through the bank when the company is solid but its payment terms are short."""
    a = Assessment("confirming")
    inv = s.invoices
    if not inv.has_erp or inv.ap_monthly < cfg.MIN_MONTHLY_PURCHASES_EUR:
        return a.add(
            block(
                "sin_compras",
                f"No vemos compras a proveedores suficientes ({eur(inv.ap_monthly)} al mes); el confirming necesita tu ERP conectado.",
            )
        )
    a.add(already_holds(s, "confirming", "una línea de confirming"))
    a.add(confidence_gate(s)).add(pulse_gate(s, cfg.MIN_PULSE_NEW_CREDIT))
    terms, dpo = s.raw("terms"), s.raw("dpo")
    if terms is not None and terms < cfg.SHORT_TERMS_DAYS:
        a.add(
            pro(
                "plazo_corto",
                f"Tus proveedores te conceden {days(terms)} de media (umbral {cfg.SHORT_TERMS_DAYS:.0f}).",
                25,
                variable="terms",
                value=terms,
                unit="días",
            )
        )
    if terms is not None and dpo is not None and dpo > terms + 10:
        a.add(
            pro(
                "pago_tardio",
                f"Pagas a {days(dpo)} frente a {days(terms)} pactados: el confirming regulariza el retraso sin tensar la relación.",
                20,
                variable="dpo",
                value=dpo,
                unit="días",
            )
        )
    elif terms is not None and dpo is not None and dpo + 10 < terms:
        a.add(
            contra(
                "pago_anticipado",
                f"Pagas a {days(dpo)}, antes de los {days(terms)} pactados: ya tienes margen.",
                10,
                variable="dpo",
                value=dpo,
                unit="días",
            )
        )
    a.add(cash_days_reason(s, low_points=10, high_points=-5))
    if s.pulse >= 50:
        a.add(
            pro(
                "pagador_solido",
                f"Un PULSE de {s.pulse:.0f} es lo que un banco busca para asumir tus pagos a proveedores.",
                15,
                value=s.pulse,
                unit="PULSE",
            )
        )
    elif s.pulse < 45:
        a.add(
            contra(
                "pulse_justo",
                f"Con un PULSE de {s.pulse:.0f} el banco cubrirá una parte menor de tus compras.",
                15,
                value=s.pulse,
                unit="PULSE",
            )
        )
    if inv.ap_monthly >= 100_000:
        a.add(
            pro(
                "volumen_compras",
                f"Compras {eur(inv.ap_monthly)} al mes: volumen suficiente para negociar un buen precio.",
                5,
                value=inv.ap_monthly,
                unit="EUR/mes",
            )
        )
    return a
