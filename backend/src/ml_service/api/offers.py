"""Dynamic working-capital offer: the product formula, server-side.

The web demo mirrors this logic; this module is the source of truth::

    limit = clamp(k(score) * avg_monthly_inflow_3m, 0, 2_000_000)

with ``k`` stepped by score band, adjusted by the detected regime.
"""

from __future__ import annotations

from ml_service.api.schemas import Offer

MAX_LIMIT = 2_000_000.0
BASE_SPREAD_BPS = 250
STRESS_SPREAD_BPS = 1200
DECLINE_FACTOR = 0.5
IMPROVEMENT_FACTOR = 1.15
MAX_K = 1.0

SCORE_BANDS: tuple[tuple[float, float], ...] = (
    (80.0, 1.0),
    (65.0, 0.8),
    (50.0, 0.5),
    (35.0, 0.25),
)

PREAPPROVED_SCORE = 50.0
PREAPPROVED_STRESS = 0.35
WATCH_SCORE = 35.0
WATCH_STRESS = 0.6


def base_k(score: float) -> float:
    """Return the base multiplier for a 0-100 score."""
    for threshold, factor in SCORE_BANDS:
        if score >= threshold:
            return factor
    return 0.0


def adjust_k(k: float, regime: str | None) -> float:
    """Apply the regime adjustment to the base multiplier."""
    if regime == "structural_decline":
        return k * DECLINE_FACTOR
    if regime == "structural_improvement":
        return min(k * IMPROVEMENT_FACTOR, MAX_K)
    return k


def offer_status(score: float, p_stress: float) -> str:
    """Classify the offer as ``preaprobada``, ``en_vigilancia`` or ``cerrada``."""
    if score >= PREAPPROVED_SCORE and p_stress < PREAPPROVED_STRESS:
        return "preaprobada"
    if (
        WATCH_SCORE <= score < PREAPPROVED_SCORE
        or PREAPPROVED_STRESS <= p_stress < WATCH_STRESS
    ):
        return "en_vigilancia"
    return "cerrada"


def spread_bps(p_stress: float) -> int:
    """Risk-based spread in basis points."""
    return BASE_SPREAD_BPS + round(STRESS_SPREAD_BPS * p_stress)


def avg_inflow_3m(series: list[dict], upto: int | None = None) -> float:
    """Average monthly inflow over the trailing three months of ``series``."""
    end = len(series) if upto is None else upto + 1
    window = series[max(0, end - 3) : end]
    values = [float(m.get("raw", {}).get("inflow") or 0.0) for m in window]
    return sum(values) / len(values) if values else 0.0


def build_offer(
    company_id: str,
    month: str | None,
    score: float | None,
    p_stress: float | None,
    regime: str | None,
    avg_inflow: float,
) -> Offer:
    """Assemble one offer from already-extracted inputs."""
    safe_score = float(score or 0.0)
    safe_stress = float(p_stress or 0.0)
    k = adjust_k(base_k(safe_score), regime)
    limit = min(max(k * max(avg_inflow, 0.0), 0.0), MAX_LIMIT)
    return Offer(
        company_id=company_id,
        month=month,
        score=round(safe_score, 2),
        p_stress=round(safe_stress, 4),
        regime=regime,
        avg_monthly_inflow_3m=round(avg_inflow, 2),
        k=round(k, 4),
        limit=round(limit, 2),
        spread_bps=spread_bps(safe_stress),
        status=offer_status(safe_score, safe_stress),
    )


def compute_offer(company: dict) -> Offer:
    """Compute the current working-capital offer for one company record.

    Args:
        company: Company record as produced by ``company_records``; the
            trailing inflow is read from ``series[-3:].raw.inflow`` unless the
            record carries an explicit ``avg_monthly_inflow_3m``.

    Returns:
        The offer for the company's latest month.
    """
    series = company.get("series") or []
    explicit = company.get("avg_monthly_inflow_3m")
    avg_inflow = float(explicit) if explicit is not None else avg_inflow_3m(series)
    month = series[-1].get("month") if series else None
    return build_offer(
        company_id=str(company.get("company_id", "")),
        month=month,
        score=company.get("score"),
        p_stress=company.get("p_stress"),
        regime=company.get("regime"),
        avg_inflow=avg_inflow,
    )


def offer_history(company: dict, months: int = 12) -> list[Offer]:
    """Recompute the offer for each of the last ``months`` months of the series."""
    series = company.get("series") or []
    start = max(0, len(series) - months)
    out: list[Offer] = []
    for index in range(start, len(series)):
        month = series[index]
        out.append(
            build_offer(
                company_id=str(company.get("company_id", "")),
                month=month.get("month"),
                score=month.get("score"),
                p_stress=month.get("p_stress"),
                regime=month.get("regime"),
                avg_inflow=avg_inflow_3m(series, index),
            )
        )
    return out
