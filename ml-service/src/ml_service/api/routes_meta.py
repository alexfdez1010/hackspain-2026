"""Health and metadata endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from ml_service.api.deps import StoreDep
from ml_service.api.schemas import Health, Meta

router = APIRouter(tags=["meta"])


@router.get("/health", response_model=Health)
def health(store: StoreDep) -> Health:
    """Report service liveness and what artefacts are loaded."""
    return Health(**store.health())


@router.get("/api/meta", response_model=Meta)
def meta(store: StoreDep) -> Meta:
    """Return pillar/feature labels plus evaluation and anticipation blocks."""
    return Meta(**store.meta())
