"""Spanish formatting helpers for explanation narratives."""

from __future__ import annotations

import math
from datetime import datetime

MONTHS_ES: tuple[str, ...] = (
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
)

UNITS: dict[str, str] = {
    "cash_runway_months": "months",
    "cash_to_inflow": "ratio",
    "min_balance_ratio": "ratio",
    "leverage_ratio": "ratio",
    "dso_days": "days",
    "supplier_delay_days": "days",
    "months_observed": "count",
}
DEFAULT_UNIT = "pct"


def month_label(month: datetime | str | None) -> str:
    """Spanish month name plus year, e.g. ``marzo de 2026``."""
    if month is None:
        return "el inicio de la serie"
    if isinstance(month, str):
        year, num = int(month[:4]), int(month[5:7])
    else:
        year, num = month.year, month.month
    return f"{MONTHS_ES[num - 1]} de {year}"


def is_missing(value: float | None) -> bool:
    """True when a value is absent or NaN."""
    return value is None or math.isnan(float(value))


def unit_of(feature: str) -> str:
    """Unit family used to render the raw value of ``feature``."""
    return UNITS.get(feature, DEFAULT_UNIT)


def format_value(feature: str, value: float | None) -> str:
    """Render a raw feature value with its Spanish unit."""
    if is_missing(value):
        return "s/d"
    value = float(value)
    unit = unit_of(feature)
    if unit == "days":
        return f"{value:.0f} días"
    if unit == "months":
        return f"{value:.1f} meses"
    if unit == "ratio":
        return f"{value:.2f}x"
    if unit == "count":
        return f"{value:.0f}"
    return f"{value * 100:.0f}%"


def format_pair(feature: str, before: float | None, after: float | None) -> str:
    """Render a before/after pair, keeping the unit only once (``41→58 días``)."""
    unit = unit_of(feature)
    if is_missing(before) or is_missing(after):
        return format_value(feature, after)
    before, after = float(before), float(after)
    if unit == "days":
        return f"{before:.0f}→{after:.0f} días"
    if unit == "months":
        return f"{before:.1f}→{after:.1f} meses"
    if unit == "ratio":
        return f"{before:.2f}→{after:.2f}x"
    if unit == "count":
        return f"{before:.0f}→{after:.0f}"
    return f"{before * 100:.0f}→{after * 100:.0f}%"


def points_phrase(points: float) -> str:
    """``7 puntos`` / ``1 punto`` with the right plural."""
    n = abs(points)
    return "1 punto" if round(n) == 1 else f"{n:.0f} puntos"
