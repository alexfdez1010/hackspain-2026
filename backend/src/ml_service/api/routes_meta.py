"""Health endpoint: liveness plus which PULSE artefacts are on disk."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, Request

router = APIRouter(tags=["meta"])


def _summary(path: Path) -> dict:
    """Read the PULSE web summary, or an empty dict when absent or malformed."""
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return {}
    return payload if isinstance(payload, dict) else {}


@router.get("/health")
def health(request: Request) -> dict:
    """Report service liveness and what artefacts are loaded.

    ``status`` is ``ok`` when the PULSE web export is present, ``degraded``
    otherwise; the API still boots so the container passes its health check
    while artefacts are being regenerated.
    """
    settings = request.app.state.settings
    summary = _summary(settings.web_dir / "summary.json")
    companies = summary.get("companies")
    return {
        "status": "ok" if companies else "degraded",
        "n_companies": len(companies) if isinstance(companies, list) else 0,
        "last_month": summary.get("last_month"),
        "recommendations_loaded": (
            settings.recommendations_dir / "summary.json"
        ).exists(),
    }
