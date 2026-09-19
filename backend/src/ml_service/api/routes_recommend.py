"""PULSE Advisor endpoints: product catalogue, portfolio summary and per-company recommendations.

Every listing/company route accepts ``?euribor=0.025`` (annual decimal). When
present, the recommendations are recomputed over that risk-free rate instead of
served from the static export; spreads in basis points do not change.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Request

from ml_service.api.advisor_runtime import get_runtime

router = APIRouter(prefix="/api/pulse/recommendations", tags=["recommendations"])

DEFAULT_LIMIT = 100
MAX_LIMIT = 2000
EuriborParam = Annotated[
    float | None,
    Query(ge=-0.01, le=0.25, description="Reference rate override, annual decimal"),
]


def _dir(request: Request) -> Path:
    """Folder written by ``ml_service.pulse.recommend.cli build``."""
    return request.app.state.settings.recommendations_dir


def _read(path: Path) -> dict:
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"{path.name} not found")
    return json.loads(path.read_text())


@router.get("/catalogue")
def catalogue(request: Request) -> dict:
    """Products, pricing parameters and the risk model's evaluation, without company rows."""
    summary = _read(_dir(request) / "summary.json")
    return {k: v for k, v in summary.items() if k != "companies"}


@router.get("")
def portfolio(
    request: Request,
    product: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = DEFAULT_LIMIT,
    euribor: EuriborParam = None,
) -> dict:
    """One row per company with its top recommendation, optionally filtered by top product."""
    summary = _read(_dir(request) / "summary.json")
    reference = summary["reference_rate"]
    rows = summary["companies"]
    if euribor is not None:
        rows = get_runtime(request).portfolio(euribor)
        reference = {**reference, "value": euribor, "source": "request"}
    if product:
        rows = [r for r in rows if r["top_product"] == product]
    rows.sort(key=lambda r: (-(r["top_fit"] or 0.0), r["company_id"]))
    by_product: dict[str, int] = {}
    for r in summary["companies"]:
        key = r["top_product"] or "ninguno"
        by_product[key] = by_product.get(key, 0) + 1
    return {
        "items": rows[:limit],
        "total": len(rows),
        "limit": limit,
        "by_top_product": by_product,
        "reference_rate": reference,
    }


@router.get("/{company_id}")
def company(company_id: str, request: Request, euribor: EuriborParam = None) -> dict:
    """Full explainable recommendation for one company, re-priced when ``euribor`` is given."""
    safe = Path(company_id).name
    if euribor is not None:
        return get_runtime(request).company(safe, euribor)
    return _read(_dir(request) / "companies" / f"{safe}.json")
