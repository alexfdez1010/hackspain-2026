"""Filtering, sorting and aggregation helpers for company listings."""

from __future__ import annotations

from collections import Counter
from typing import Any

from ml_service.api.schemas import Mover, Totals

AT_RISK_STRESS = 0.5
SORT_KEYS: tuple[str, ...] = ("score", "p_stress", "trend_6m", "company_id")
DEFAULT_SORT = "-score"


def summary_view(record: dict) -> dict[str, Any]:
    """Company record without its monthly series."""
    return {k: v for k, v in record.items() if k not in {"series", "explanation"}}


def _matches(
    record: dict, direction: str | None, regime: str | None, q: str | None
) -> bool:
    if direction and record.get("direction") != direction:
        return False
    if regime and record.get("regime") != regime:
        return False
    return not (q and q.lower() not in str(record.get("company_id", "")).lower())


def filter_companies(
    records: list[dict],
    direction: str | None = None,
    regime: str | None = None,
    min_score: float | None = None,
    max_score: float | None = None,
    q: str | None = None,
) -> list[dict]:
    """Apply every listing filter, keeping the input order."""
    out = []
    for record in records:
        if not _matches(record, direction, regime, q):
            continue
        score = record.get("score")
        if min_score is not None and (score is None or score < min_score):
            continue
        if max_score is not None and (score is None or score > max_score):
            continue
        out.append(record)
    return out


def sort_companies(records: list[dict], sort: str | None = None) -> list[dict]:
    """Sort by ``field`` or ``-field``; unknown keys fall back to the default."""
    raw = sort or DEFAULT_SORT
    descending = raw.startswith("-")
    key = raw.lstrip("-")
    if key not in SORT_KEYS:
        key, descending = "score", True
    if key == "company_id":
        return sorted(
            records, key=lambda r: str(r.get("company_id", "")), reverse=descending
        )
    fallback = float("-inf") if descending else float("inf")
    return sorted(
        records,
        key=lambda r: (
            float(r[key]) if r.get(key) is not None else fallback,
            str(r.get("company_id", "")),
        ),
        reverse=descending,
    )


def totals(records: list[dict]) -> Totals:
    """Aggregate a filtered company list."""
    scores = [float(r["score"]) for r in records if r.get("score") is not None]
    at_risk = sum(
        1 for r in records if float(r.get("p_stress") or 0.0) >= AT_RISK_STRESS
    )
    return Totals(
        n_companies=len(records),
        avg_score=round(sum(scores) / len(scores), 2) if scores else None,
        by_direction=dict(Counter(str(r.get("direction")) for r in records)),
        by_regime=dict(Counter(str(r.get("regime")) for r in records)),
        at_risk=at_risk,
    )


def _delta(
    record: dict, window: int
) -> tuple[float, float | None, float | None] | None:
    series = record.get("series") or []
    if len(series) <= window:
        return None
    now = series[-1].get("score")
    then = series[-1 - window].get("score")
    if now is None or then is None:
        return None
    return float(now) - float(then), float(now), float(then)


def movers(
    records: list[dict], window: int = 6, limit: int = 10
) -> tuple[list[Mover], list[Mover]]:
    """Return the top improvers and decliners over ``window`` months."""
    ranked: list[tuple[float, Mover]] = []
    for record in records:
        computed = _delta(record, window)
        if computed is None:
            continue
        delta, now, then = computed
        ranked.append(
            (
                delta,
                Mover(
                    company_id=str(record.get("company_id", "")),
                    score=round(now, 2) if now is not None else None,
                    score_then=round(then, 2) if then is not None else None,
                    delta=round(delta, 2),
                    direction=record.get("direction"),
                    regime=record.get("regime"),
                ),
            )
        )
    ranked.sort(key=lambda item: item[0])
    decliners = [mover for _, mover in ranked[:limit]]
    improvers = [mover for _, mover in ranked[::-1][:limit]]
    return improvers, decliners
