"""PULSE endpoints: portfolio summary and per-company history + forecast, served from the web export."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/api/pulse", tags=["pulse"])


def _web_dir(request: Request) -> Path:
    """Folder written by ``ml_service.pulse.export_web`` (``<data_dir>/pulse/web``)."""
    return request.app.state.settings.data_dir / "pulse" / "web"


def _read(path: Path) -> dict:
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"{path.name} not found")
    return json.loads(path.read_text())


@router.get("/summary")
def summary(request: Request) -> dict:
    """Score metadata (variables, weights, horizons) and one row per company with its latest PULSE."""
    return _read(_web_dir(request) / "summary.json")


@router.get("/companies/{company_id}")
def company(company_id: str, request: Request) -> dict:
    """Monthly PULSE series with variables and contributions, plus the +1..+6 month forecast."""
    safe = Path(company_id).name
    return _read(_web_dir(request) / "companies" / f"{safe}.json")
