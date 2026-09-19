"""Shared vocabulary of the eligibility rules: reasons, assessments and formatting helpers."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from ml_service.pulse.recommend import config as cfg
from ml_service.pulse.recommend.snapshot import CompanySnapshot

Kind = Literal["pro", "contra", "bloqueo"]
BASE_FIT = 30.0


@dataclass(frozen=True)
class Reason:
    """One argument for or against a product, always tied to a number the company can check."""

    code: str
    text: str
    kind: Kind
    points: float = 0.0
    variable: str | None = None
    value: float | None = None
    unit: str | None = None


@dataclass
class Assessment:
    """Outcome of the rules for one product: eligible or not, how well it fits, and why."""

    product: str
    reasons: list[Reason] = field(default_factory=list)

    @property
    def eligible(self) -> bool:
        return not any(r.kind == "bloqueo" for r in self.reasons)

    @property
    def fit(self) -> float:
        if not self.eligible:
            return 0.0
        return max(0.0, min(100.0, BASE_FIT + sum(r.points for r in self.reasons)))

    def add(self, reason: Reason | None) -> Assessment:
        if reason is not None:
            self.reasons.append(reason)
        return self


def pro(code: str, text: str, points: float, **tie) -> Reason:
    return Reason(code, text, "pro", points, **tie)


def contra(code: str, text: str, points: float, **tie) -> Reason:
    return Reason(code, text, "contra", -abs(points), **tie)


def block(code: str, text: str, **tie) -> Reason:
    return Reason(code, text, "bloqueo", 0.0, **tie)


def eur(x: float | None) -> str:
    if x is None:
        return "n/d"
    if abs(x) >= 1_000_000:
        return f"{x / 1_000_000:.1f} M€"
    return f"{x:,.0f} €".replace(",", ".")


def pct(x: float | None, digits: int = 0) -> str:
    return "n/d" if x is None else f"{x * 100:.{digits}f} %"


def days(x: float | None) -> str:
    return "n/d" if x is None else f"{x:.0f} días"


def confidence_gate(s: CompanySnapshot) -> Reason | None:
    """Block credit when too little of the score is backed by data."""
    if s.confidence >= cfg.MIN_CONFIDENCE_FOR_CREDIT:
        return None
    return block(
        "datos_insuficientes",
        f"Solo el {pct(s.confidence)} de tu PULSE está respaldado por datos; conecta tu ERP o más cuentas para poder ofrecerte financiación.",
        value=s.confidence,
        unit="cobertura",
    )


def pulse_gate(
    s: CompanySnapshot, minimum: float, code: str = "pulse_bajo"
) -> Reason | None:
    if s.pulse >= minimum:
        return None
    return block(
        code,
        f"Tu PULSE es {s.pulse:.0f}, por debajo del mínimo de {minimum:.0f} para este producto.",
        value=s.pulse,
        unit="PULSE",
    )


def already_holds(s: CompanySnapshot, dataset_type: str, label: str) -> Reason | None:
    if not s.holdings.has(dataset_type):
        return None
    return block(
        "ya_contratado",
        f"Ya tienes {label}; revisamos su límite en lugar de abrir otro.",
    )


def trend_reason(
    s: CompanySnapshot, when_declining: float, when_improving: float
) -> Reason | None:
    """Points for the one-year outlook (positive ``when_declining`` favours defensive products)."""
    delta = s.forecast_delta
    if delta is None:
        return None
    if delta <= cfg.TREND_DECLINE_POINTS:
        return Reason(
            "tendencia_bajista",
            f"Prevemos que tu PULSE baje {abs(delta):.0f} puntos en un año.",
            "pro" if when_declining > 0 else "contra",
            when_declining,
            value=delta,
            unit="puntos PULSE a +12 m",
        )
    if delta >= cfg.TREND_IMPROVE_POINTS:
        return Reason(
            "tendencia_alcista",
            f"Prevemos que tu PULSE suba {delta:.0f} puntos en un año.",
            "pro" if when_improving > 0 else "contra",
            when_improving,
            value=delta,
            unit="puntos PULSE a +12 m",
        )
    return None


def cash_days_reason(
    s: CompanySnapshot, low_points: float, high_points: float
) -> Reason | None:
    cd = s.raw("cash_days")
    if cd is None:
        return None
    if cd < cfg.LOW_CASH_DAYS:
        return pro(
            "caja_corta",
            f"Tu caja a cierre de mes cubre solo {days(cd)} de pagos operativos (umbral {cfg.LOW_CASH_DAYS:.0f}).",
            low_points,
            variable="cash_days",
            value=cd,
            unit="días",
        )
    if cd > cfg.COMFORT_CASH_DAYS:
        return Reason(
            "caja_holgada",
            f"Tu caja cubre {days(cd)} de pagos: más de {cfg.COMFORT_CASH_DAYS:.0f}, un colchón cómodo.",
            "pro" if high_points > 0 else "contra",
            high_points,
            variable="cash_days",
            value=cd,
            unit="días",
        )
    return None
