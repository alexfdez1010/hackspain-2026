"""Dynamic working-capital offer endpoints."""

from __future__ import annotations

from collections import Counter
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from ml_service.api.deps import StoreDep
from ml_service.api.offers import compute_offer, offer_history
from ml_service.api.schemas import Offer, OfferDetail, OfferPage, OfferTotals

router = APIRouter(prefix="/api/offers", tags=["offers"])

DEFAULT_LIMIT = 50
MAX_LIMIT = 2000
HISTORY_MONTHS = 12


def _totals(offers: list[Offer]) -> OfferTotals:
    """Aggregate a list of offers."""
    count = len(offers)
    total_limit = sum(offer.limit for offer in offers)
    avg_spread = sum(offer.spread_bps for offer in offers) / count if count else 0.0
    return OfferTotals(
        n_offers=count,
        total_limit=round(total_limit, 2),
        avg_limit=round(total_limit / count, 2) if count else 0.0,
        avg_spread_bps=round(avg_spread, 1),
        by_status=dict(Counter(offer.status for offer in offers)),
    )


@router.get("", response_model=OfferPage)
def list_offers(
    store: StoreDep,
    status_filter: Annotated[str | None, Query(alias="status")] = None,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = DEFAULT_LIMIT,
) -> OfferPage:
    """List working-capital offers for every company, plus portfolio totals."""
    offers = [compute_offer(record) for record in store.companies()]
    if status_filter:
        offers = [offer for offer in offers if offer.status == status_filter]
    offers.sort(key=lambda offer: (-offer.limit, offer.company_id))
    return OfferPage(
        items=offers[:limit],
        total=len(offers),
        limit=limit,
        totals=_totals(offers),
    )


@router.get("/{company_id}", response_model=OfferDetail)
def get_offer(store: StoreDep, company_id: str) -> OfferDetail:
    """Return one company's current offer and its 12-month limit history."""
    record = store.company(company_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown company {company_id!r}",
        )
    return OfferDetail(
        offer=compute_offer(record),
        history=offer_history(record, months=HISTORY_MONTHS),
    )
