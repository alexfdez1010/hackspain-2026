"""FastAPI application factory for the PULSE service."""

from __future__ import annotations

from collections.abc import Iterable

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ml_service.api import routes_meta, routes_pulse, routes_recommend
from ml_service.api.settings import Settings, build_settings

TITLE = "HackSpain 2026 · Embat PULSE API"
DESCRIPTION = (
    "Transparent monthly financial-health score (0-100) for SMEs: PULSE "
    "history and one-year forecast per company, plus priced product recommendations."
)
VERSION = "2.0.0"

ROUTERS: tuple[APIRouter, ...] = (
    routes_meta.router,
    routes_pulse.router,
    routes_recommend.router,
)


def create_app(
    settings: Settings | None = None,
    routers: Iterable[APIRouter] = ROUTERS,
) -> FastAPI:
    """Build the API.

    Args:
        settings: Configuration; read from the environment when omitted.
        routers: Routers to mount, defaulting to every API router.

    Returns:
        The configured FastAPI application.
    """
    app = FastAPI(title=TITLE, description=DESCRIPTION, version=VERSION)
    app.state.settings = settings or build_settings()
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
