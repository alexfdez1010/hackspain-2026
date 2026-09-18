"""FastAPI application factory for the X-Ray service."""

from __future__ import annotations

from collections.abc import AsyncIterator, Iterable
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ml_service.api import (
    routes_alerts,
    routes_companies,
    routes_meta,
    routes_offers,
    routes_scoring,
)
from ml_service.api.settings import Settings, build_settings
from ml_service.api.store import ArtefactStore, RecordStore

TITLE = "HackSpain 2026 · Embat X-Ray API"
DESCRIPTION = (
    "Monthly financial-health score (0-100) for SMEs: company records, "
    "alerts, dynamic working-capital offers and ad-hoc scoring."
)
VERSION = "1.0.0"

ROUTERS: tuple[APIRouter, ...] = (
    routes_meta.router,
    routes_companies.router,
    routes_alerts.router,
    routes_offers.router,
    routes_scoring.router,
)


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Load the artefact store once, unless one was injected already."""
    if getattr(app.state, "store", None) is None:
        app.state.store = ArtefactStore.load(app.state.settings)
    yield


def create_app(
    settings: Settings | None = None,
    store: RecordStore | None = None,
    routers: Iterable[APIRouter] = ROUTERS,
) -> FastAPI:
    """Build the API.

    Args:
        settings: Configuration; read from the environment when omitted.
        store: Pre-built read model; loaded from disk at start-up when omitted
            (tests inject a fake store here).
        routers: Routers to mount, defaulting to every API router.

    Returns:
        The configured FastAPI application.
    """
    app = FastAPI(
        title=TITLE, description=DESCRIPTION, version=VERSION, lifespan=_lifespan
    )
    app.state.settings = settings or build_settings()
    app.state.store = store
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(app.state.settings.cors_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    for router in routers:
        app.include_router(router)
    return app


app = create_app()
