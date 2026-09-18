"""Delta-SHAP: what moved the score between two months, and how to say it."""

from __future__ import annotations

from datetime import datetime
from typing import Any

import polars as pl

from ml_service.xray.config import FEATURE_SPECS
from ml_service.xray.explain.attribution import SHAP_SUFFIX
from ml_service.xray.explain.format_es import (
    format_pair,
    is_missing,
    month_label,
    points_phrase,
)
from ml_service.xray.explain.regime_es import regime_text_es

LONG_WINDOW = 6
WATERFALL_LIMIT = 8
NARRATIVE_ITEMS = 3
MIN_DELTA_POINTS = 0.2
MIN_SCORE_MOVE = 1.0
MIN_RESCALE = 0.2
MAX_RESCALE = 5.0

Row = dict[str, Any]

__all__ = ["explain_change", "regime_text_es"]


def _num(value: object) -> float | None:
    return None if is_missing(value) else round(float(value), 4)  # type: ignore[arg-type]


def _month_str(month: object) -> str | None:
    return month.strftime("%Y-%m") if isinstance(month, datetime) else month  # type: ignore[return-value]


def _rescale(deltas: list[float], before: Row, after: Row) -> float:
    """Factor that makes the attributed deltas add up to the real score move.

    Raw delta-SHAP lives in pre-calibration points, while the published score
    also goes through the percentile calibration and the EWMA smoother. Scaling
    the whole vector by one factor keeps the ranking and the signs untouched but
    lets the waterfall close on the number the user sees. The factor is only
    applied when it stays within a sane band, so a near-zero denominator can
    never blow up a single feature.
    """
    total = sum(deltas)
    moved = float(after["score"]) - float(before["score"])
    if abs(total) < MIN_DELTA_POINTS or total * moved <= 0:
        return 1.0
    factor = moved / total
    return factor if MIN_RESCALE <= factor <= MAX_RESCALE else 1.0


def waterfall(before: Row, after: Row, limit: int = WATERFALL_LIMIT) -> list[Row]:
    """Per-feature change in attributed points between two months, biggest first.

    The vector is rescaled by :func:`_rescale` so the contributions add up to
    the score move the user actually sees.
    """
    raw: list[tuple[object, float]] = []
    for spec in FEATURE_SPECS:
        old, new = (
            before.get(f"{spec.name}{SHAP_SUFFIX}"),
            after.get(f"{spec.name}{SHAP_SUFFIX}"),
        )
        if is_missing(old) or is_missing(new):
            continue
        raw.append((spec, float(new) - float(old)))
    factor = _rescale([delta for _, delta in raw], before, after)
    rows = [
        {
            "feature": spec.name,
            "label": spec.label_es,
            "pillar": spec.pillar,
            "delta_points": round(delta * factor, 2),
            "value_before": _num(before.get(spec.name)),
            "value_after": _num(after.get(spec.name)),
        }
        for spec, delta in raw
        if abs(delta * factor) >= MIN_DELTA_POINTS
    ]
    rows.sort(key=lambda item: -abs(item["delta_points"]))
    return rows[:limit]


def _clause(item: Row) -> str:
    pair = format_pair(item["feature"], item["value_before"], item["value_after"])
    return f"{points_phrase(item['delta_points'])} por {item['label'].lower()} ({pair})"


def narrative_es(before: Row, after: Row, items: list[Row]) -> str:
    """One Spanish sentence describing the move and its main drivers."""
    start, end = float(before["score"]), float(after["score"])
    delta = end - start
    when = month_label(before["month"])
    if abs(delta) < MIN_SCORE_MOVE:
        return f"El score se mantiene estable en {end:.0f} puntos desde {when}."
    verb = "bajó" if delta < 0 else "subió"
    drivers = [i for i in items if (i["delta_points"] < 0) == (delta < 0)][
        :NARRATIVE_ITEMS
    ]
    head = (
        f"El score {verb} {points_phrase(delta)} ({start:.0f}→{end:.0f}) desde {when}"
    )
    if not drivers:
        return f"{head}."
    return f"{head}: " + ", ".join(_clause(item) for item in drivers) + "."


def explain_change(company_series: pl.DataFrame | list[Row]) -> Row:
    """Explain the latest month of one company against its own recent past.

    Args:
        company_series: Rows for a single company sorted by month ascending,
            already enriched with ``<feature>__shap`` columns.

    Returns:
        A JSON-serialisable dict with the month-over-month and six-month
        waterfalls, Spanish narratives for both, and the regime sentence.

    Raises:
        ValueError: If the series is empty.
    """
    rows = (
        company_series.to_dicts()
        if isinstance(company_series, pl.DataFrame)
        else list(company_series)
    )
    if not rows:
        raise ValueError("explain_change needs at least one scored month")
    last = rows[-1]
    prev = rows[-2] if len(rows) > 1 else None
    ref = rows[-1 - LONG_WINDOW] if len(rows) > LONG_WINDOW else None
    base = ref or prev
    long_wf = waterfall(base, last) if base else []
    short_wf = waterfall(prev, last) if prev else []
    return {
        "month": _month_str(last["month"]),
        "score": _num(last["score"]),
        "score_prev": _num(prev["score"]) if prev else None,
        "score_ref": _num(base["score"]) if base else None,
        "reference_month": _month_str(base["month"]) if base else None,
        "window_months": (LONG_WINDOW if ref else 1) if base else 0,
        "waterfall": long_wf,
        "waterfall_1m": short_wf,
        "narrative_es": (
            narrative_es(base, last, long_wf)
            if base
            else "Primer mes con datos: aún no hay comparación disponible."
        ),
        "narrative_1m_es": narrative_es(prev, last, short_wf) if prev else None,
        "regime_text_es": regime_text_es(last),
    }
