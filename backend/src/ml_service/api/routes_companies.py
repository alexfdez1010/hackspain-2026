"""Company listing, detail and movers endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from ml_service.api import filters
from ml_service.api.deps import StoreDep
from ml_service.api.offers import compute_offer
from ml_service.api.schemas import CompanyDetail, CompanyPage, CompanySummary, Movers

router = APIRouter(prefix="/api", tags=["companies"])

MAX_LIMIT = 500
DEFAULT_LIMIT = 50
MAX_WINDOW = 24


@router.get("/companies", response_model=CompanyPage)
def list_companies(
    store: StoreDep,
    direction: str | None = None,
    regime: str | None = None,
    min_score: float | None = None,
    max_score: float | None = None,
    q: str | None = None,
    sort: str | None = None,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = DEFAULT_LIMIT,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> CompanyPage:
    """List company summaries (no series) with filters, sorting and paging."""
    matched = filters.filter_companies(
        store.companies(), direction, regime, min_score, max_score, q
    )
    ordered = filters.sort_companies(matched, sort)
    page = ordered[offset : offset + limit]
    return CompanyPage(
        items=[CompanySummary(**filters.summary_view(record)) for record in page],
        total=len(matched),
        limit=limit,
        offset=offset,
        totals=filters.totals(matched),
    )


@router.get("/movers", response_model=Movers)
def list_movers(
    store: StoreDep,
    window: Annotated[int, Query(ge=1, le=MAX_WINDOW)] = 6,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
) -> Movers:
    """Rank the biggest score improvements and declines over a window."""
    improvers, decliners = filters.movers(store.companies(), window=window, limit=limit)
    return Movers(window=window, improvers=improvers, decliners=decliners)


@router.get("/companies/{company_id}", response_model=CompanyDetail)
def get_company(store: StoreDep, company_id: str) -> CompanyDetail:
    """Return one company with its series, alerts, explanation and offer."""
    record = store.company(company_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown company {company_id!r}",
        )
    alerts = [a for a in store.alerts() if a.get("company_id") == company_id]
    company = {k: v for k, v in record.items() if k != "explanation"}
    return CompanyDetail(
        company=company,
        alerts=alerts,
        explanation=record.get("explanation"),
        offer=compute_offer(record),
    )
