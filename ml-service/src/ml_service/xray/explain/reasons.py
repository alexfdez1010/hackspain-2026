"""Reason codes: the features that move one company-month's score the most."""

from __future__ import annotations

from typing import Any

from ml_service.xray.config import FEATURE_SPECS
from ml_service.xray.explain.attribution import SHAP_SUFFIX
from ml_service.xray.explain.format_es import is_missing

DEFAULT_K = 3
MIN_IMPACT = 0.05  # points; below this a reason is noise, not a reason


def _value(row: dict[str, Any], name: str) -> float | None:
    value = row.get(name)
    return None if is_missing(value) else round(float(value), 4)


def _impact(row: dict[str, Any], name: str) -> float | None:
    """SHAP points for a feature, or its normalised deviation when SHAP is absent.

    Rows that never went through
    :func:`ml_service.xray.explain.attribution.explain_rows` still get usable
    reason codes from the transparent ``<name>__norm`` deviation.
    """
    shap_points = row.get(f"{name}{SHAP_SUFFIX}")
    if not is_missing(shap_points):
        return float(shap_points)  # type: ignore[arg-type]
    normalised = row.get(f"{name}__norm")
    return None if is_missing(normalised) else (float(normalised) - 0.5) * 100.0  # type: ignore[arg-type]


def feature_impacts(row: dict[str, Any]) -> list[dict[str, Any]]:
    """Every known feature with its signed impact in score points, best first."""
    items: list[dict[str, Any]] = []
    for spec in FEATURE_SPECS:
        impact = _impact(row, spec.name)
        if impact is None or not row.get(f"{spec.name}__known"):
            continue
        items.append(
            {
                "feature": spec.name,
                "label": spec.label_es,
                "pillar": spec.pillar,
                "impact": round(float(impact), 2),
                "value": _value(row, spec.name),
            }
        )
    items.sort(key=lambda item: item["impact"])
    return items


def top_reasons(row: dict[str, Any], k: int = DEFAULT_K) -> list[dict[str, Any]]:
    """Top-k harmful and top-k helpful features for a scored company-month.

    Args:
        row: A scored row enriched by
            :func:`ml_service.xray.explain.attribution.explain_rows`.
        k: How many reasons to keep on each side.

    Returns:
        Up to ``2 * k`` dicts ``{feature, label, pillar, impact, value}`` with
        ``impact`` in score points (negative hurts the score). Harmful reasons
        come first, most harmful of all leading.
    """
    items = [item for item in feature_impacts(row) if abs(item["impact"]) >= MIN_IMPACT]
    negative = [item for item in items if item["impact"] < 0][:k]
    positive = [item for item in items if item["impact"] > 0][-k:][::-1]
    return negative + positive
