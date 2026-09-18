"""Shared FastAPI dependencies: the artefact store and the optional API key."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status

from ml_service.api.settings import Settings
from ml_service.api.store import RecordStore

BEARER_PREFIX = "bearer "


def get_settings_dep(request: Request) -> Settings:
    """Return the settings attached to the running app."""
    return request.app.state.settings


def get_store(request: Request) -> RecordStore:
    """Return the store attached to the running app."""
    store = getattr(request.app.state, "store", None)
    if store is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Artefact store is not loaded",
        )
    return store


def require_api_key(
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
    x_api_key: Annotated[str | None, Header()] = None,
) -> None:
    """Enforce ``XRAY_API_KEY`` on mutating endpoints when it is configured.

    Args:
        request: Incoming request, used to read the app settings.
        authorization: ``Authorization: Bearer <key>`` header, if any.
        x_api_key: ``X-API-Key: <key>`` header, if any.

    Raises:
        HTTPException: 401 when a key is configured and none matches.
    """
    expected = request.app.state.settings.api_key
    if not expected:
        return
    provided = x_api_key
    if authorization and authorization.lower().startswith(BEARER_PREFIX):
        provided = authorization[len(BEARER_PREFIX) :].strip()
    if provided != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
            headers={"WWW-Authenticate": "Bearer"},
        )


StoreDep = Annotated[RecordStore, Depends(get_store)]
SettingsDep = Annotated[Settings, Depends(get_settings_dep)]
ApiKeyDep = Depends(require_api_key)
