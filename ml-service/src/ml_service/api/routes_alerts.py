"""Monitoring alert endpoints."""

from __future__ import annotations

from collections import Counter
from typing import Annotated

from fastapi import APIRouter, Query

from ml_service.api.deps import StoreDep
from ml_service.api.schemas import AlertCounts, AlertPage

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

DEFAULT_LIMIT = 100
MAX_LIMIT = 1000


def _matches(
    alert: dict, kind: str | None, severity: str | None, month: str | None
) -> bool:
    """True when one alert passes every active filter."""
    if kind and alert.get("type") != kind:
        return False
    if severity and alert.get("severity") != severity:
        return False
    return not (month and str(alert.get("month", ""))[:7] != month)


@router.get("", response_model=AlertPage)
def list_alerts(
    store: StoreDep,
    type: str | None = None,
    severity: str | None = None,
    month: str | None = None,
    limit: Annotated[int, Query(ge=1, le=MAX_LIMIT)] = DEFAULT_LIMIT,
) -> AlertPage:
    """List alerts filtered by type, severity and month (``YYYY-MM``)."""
    matched = [a for a in store.alerts() if _matches(a, type, severity, month)]
    matched.sort(
        key=lambda a: (str(a.get("month", "")), str(a.get("company_id", ""))),
        reverse=True,
    )
    return AlertPage(items=matched[:limit], total=len(matched), limit=limit)


@router.get("/counts", response_model=AlertCounts)
def alert_counts(store: StoreDep) -> AlertCounts:
    """Aggregate alert counts by type, severity and month."""
    alerts = store.alerts()
    return AlertCounts(
        total=len(alerts),
        by_type=dict(Counter(str(a.get("type")) for a in alerts)),
        by_severity=dict(Counter(str(a.get("severity")) for a in alerts)),
        by_month=dict(Counter(str(a.get("month", ""))[:7] for a in alerts)),
    )
