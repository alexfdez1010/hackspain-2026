"""How much of each product to offer, with the formula spelled out for the company."""

from __future__ import annotations

import math
from dataclasses import dataclass, field

from ml_service.pulse.recommend import config as cfg
from ml_service.pulse.recommend.rules_common import eur
from ml_service.pulse.recommend.snapshot import CompanySnapshot


@dataclass(frozen=True)
class Sizing:
    """Proposed amount, its tenor and the arithmetic behind it."""

    amount: float
    tenor_months: int | None
    formula: str
    inputs: dict[str, float] = field(default_factory=dict)


def _band(table: tuple[tuple[float, float], ...], pulse: float) -> float:
    for threshold, value in table:
        if pulse >= threshold:
            return value
    return table[-1][1]


def round_amount(x: float) -> float:
    """Clamp to the facility range and round down to the nearest step."""
    x = min(max(x, 0.0), cfg.MAX_FACILITY_EUR)
    stepped = math.floor(x / cfg.ROUND_TO_EUR) * cfg.ROUND_TO_EUR
    return float(stepped if stepped >= cfg.MIN_FACILITY_EUR else 0.0)


def annuity(amount: float, annual_rate: float, months: int) -> float:
    """Constant monthly instalment (French amortisation)."""
    if months <= 0:
        return 0.0
    r = annual_rate / 12.0
    if r <= 0:
        return amount / months
    return amount * r / (1.0 - (1.0 + r) ** (-months))


def credit_line(s: CompanySnapshot) -> Sizing:
    months = _band(cfg.COVER_MONTHS_BY_PULSE, s.pulse)
    need = months * s.monthly_outflow - s.holdings.line_available
    return Sizing(
        round_amount(need),
        12,
        f"{months:.2f} meses de pagos operativos ({eur(s.monthly_outflow)}/mes, PULSE {s.pulse:.0f}) menos lo que ya tienes disponible ({eur(s.holdings.line_available)}), redondeado a {eur(cfg.ROUND_TO_EUR)}.",
        {
            "cover_months": months,
            "monthly_outflow": s.monthly_outflow,
            "line_available": s.holdings.line_available,
        },
    )


def credit_line_increase(s: CompanySnapshot) -> Sizing:
    factor = _band(cfg.LINE_INCREASE_BY_PULSE, s.pulse)
    increase = min(
        s.holdings.line_limit * factor, cfg.MAX_FACILITY_EUR - s.holdings.line_limit
    )
    return Sizing(
        round_amount(increase),
        12,
        f"{factor:.0%} sobre tu límite actual de {eur(s.holdings.line_limit)} (porcentaje según PULSE {s.pulse:.0f}).",
        {"increase_factor": factor, "line_limit": s.holdings.line_limit},
    )


def factoring(s: CompanySnapshot) -> Sizing:
    ar90 = s.raw("ar90") or 0.0
    rate = (
        cfg.FACTORING_ADVANCE_RATE if ar90 <= 0.15 else cfg.FACTORING_ADVANCE_RATE_WEAK
    )
    cap = 3.0 * s.invoices.ar_monthly if s.invoices.ar_monthly > 0 else math.inf
    limit = min(rate * s.invoices.eligible_ar, cap)
    return Sizing(
        round_amount(limit),
        12,
        f"{rate:.0%} de tus {eur(s.invoices.eligible_ar)} en facturas cobrables (no vencidas más de 90 días), con tope de tres meses de facturación ({eur(3 * s.invoices.ar_monthly)}).",
        {
            "advance_rate": rate,
            "eligible_ar": s.invoices.eligible_ar,
            "ar_monthly": s.invoices.ar_monthly,
        },
    )


def confirming(s: CompanySnapshot) -> Sizing:
    limit = cfg.CONFIRMING_MONTHS_OF_PURCHASES * s.invoices.ap_monthly
    return Sizing(
        round_amount(limit),
        12,
        f"{cfg.CONFIRMING_MONTHS_OF_PURCHASES} meses de compras a proveedores ({eur(s.invoices.ap_monthly)}/mes).",
        {
            "months_of_purchases": cfg.CONFIRMING_MONTHS_OF_PURCHASES,
            "ap_monthly": s.invoices.ap_monthly,
        },
    )


def term_loan(s: CompanySnapshot) -> Sizing:
    k = 1.0 if s.pulse >= 75 else 0.7
    amount = cfg.LOAN_MONTHS_OF_COLLECTIONS * s.monthly_collections * k
    return Sizing(
        round_amount(amount),
        cfg.LOAN_TENOR_MONTHS,
        f"{cfg.LOAN_MONTHS_OF_COLLECTIONS:.0f} meses de cobros ({eur(s.monthly_collections)}/mes) × {k:.0%} según PULSE {s.pulse:.0f}, a {cfg.LOAN_TENOR_MONTHS} meses.",
        {
            "months_of_collections": cfg.LOAN_MONTHS_OF_COLLECTIONS,
            "pulse_factor": k,
            "monthly_collections": s.monthly_collections,
        },
    )


def refinancing(s: CompanySnapshot) -> Sizing:
    outstanding = s.holdings.loan_outstanding
    amount = outstanding if outstanding > 0 else 4.0 * s.service_3m
    basis = (
        f"tu saldo vivo de préstamos ({eur(outstanding)})"
        if outstanding > 0
        else f"doce meses de servicio de deuda observado ({eur(4 * s.service_3m)})"
    )
    return Sizing(
        round_amount(amount),
        cfg.REFINANCE_TENOR_MONTHS,
        f"Agrupa {basis} en un préstamo a {cfg.REFINANCE_TENOR_MONTHS} meses.",
        {"loan_outstanding": outstanding, "service_3m": s.service_3m},
    )


def treasury_deposit(s: CompanySnapshot) -> Sizing:
    buffer = cfg.DEPOSIT_KEEP_DAYS * s.monthly_outflow / 30.0
    excess = (s.cash_end or 0.0) - buffer
    cd = s.raw("cash_days") or 0.0
    tenor = 12 if cd >= 365 else 6 if cd >= 270 else 3
    return Sizing(
        round_amount(excess),
        tenor,
        f"Tu caja ({eur(s.cash_end)}) menos {cfg.DEPOSIT_KEEP_DAYS:.0f} días de pagos operativos ({eur(buffer)}); plazo de {tenor} meses porque cubres {cd:.0f} días.",
        {"cash_end": s.cash_end or 0.0, "operating_buffer": buffer, "cash_days": cd},
    )


SIZERS = {
    "credit_line": credit_line,
    "credit_line_increase": credit_line_increase,
    "factoring": factoring,
    "confirming": confirming,
    "term_loan": term_loan,
    "refinancing": refinancing,
    "treasury_deposit": treasury_deposit,
}


def size(product_key: str, snapshot: CompanySnapshot) -> Sizing:
    """Dispatch to the product's sizing rule."""
    return SIZERS[product_key](snapshot)
