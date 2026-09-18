"""Pydantic response models for the X-Ray API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class Health(BaseModel):
    """Liveness payload with a quick view of what the service has loaded."""

    status: str
    n_companies: int
    models_loaded: bool
    generated_at: str | None = None


class Meta(BaseModel):
    """Labels and engine metadata consumed by the web app."""

    pillar_labels: dict[str, str]
    feature_labels: dict[str, str]
    evaluation: dict[str, Any] | None = None
    anticipation: dict[str, Any] | None = None


class CompanySummary(BaseModel):
    """One company without its monthly series."""

    company_id: str
    group_id: str | None = None
    months_observed: int | None = None
    score: float | None = None
    score_prev: float | None = None
    score_6m_ago: float | None = None
    trend_6m: float | None = None
    direction: str | None = None
    regime: str | None = None
    p_stress: float | None = None
    pillars: dict[str, float | None] = Field(default_factory=dict)
    reasons: list[dict[str, Any]] = Field(default_factory=list)


class Totals(BaseModel):
    """Aggregates over the companies matching a query."""

    n_companies: int
    avg_score: float | None = None
    by_direction: dict[str, int] = Field(default_factory=dict)
    by_regime: dict[str, int] = Field(default_factory=dict)
    at_risk: int = 0


class CompanyPage(BaseModel):
    """Paginated company listing."""

    items: list[CompanySummary]
    total: int
    limit: int
    offset: int
    totals: Totals


class Offer(BaseModel):
    """Dynamic working-capital offer for one company-month."""

    company_id: str
    month: str | None = None
    score: float
    p_stress: float
    regime: str | None = None
    avg_monthly_inflow_3m: float
    k: float
    limit: float
    spread_bps: int
    status: str


class OfferTotals(BaseModel):
    """Aggregates over a set of offers."""

    n_offers: int
    total_limit: float
    avg_limit: float
    avg_spread_bps: float
    by_status: dict[str, int] = Field(default_factory=dict)


class OfferPage(BaseModel):
    """Offer listing with aggregates."""

    items: list[Offer]
    total: int
    limit: int
    totals: OfferTotals


class OfferDetail(BaseModel):
    """Current offer plus a 12-month limit history."""

    offer: Offer
    history: list[Offer]


class CompanyDetail(BaseModel):
    """Full company record enriched with alerts, explanation and offer."""

    company: dict[str, Any]
    alerts: list[dict[str, Any]] = Field(default_factory=list)
    explanation: dict[str, Any] | None = None
    offer: Offer


class Mover(BaseModel):
    """One company ranked by score change over a window."""

    company_id: str
    score: float | None = None
    score_then: float | None = None
    delta: float
    direction: str | None = None
    regime: str | None = None


class Movers(BaseModel):
    """Top improvers and decliners over a window of months."""

    window: int
    improvers: list[Mover]
    decliners: list[Mover]


class AlertPage(BaseModel):
    """Filtered alert listing."""

    items: list[dict[str, Any]]
    total: int
    limit: int


class AlertCounts(BaseModel):
    """Alert counts broken down by type, severity and month."""

    total: int
    by_type: dict[str, int] = Field(default_factory=dict)
    by_severity: dict[str, int] = Field(default_factory=dict)
    by_month: dict[str, int] = Field(default_factory=dict)


class ScoreRequest(BaseModel):
    """Body of ``POST /api/score/path``."""

    raw_dir: str


class ScoreResult(BaseModel):
    """Scored companies plus the leaderboard CSV."""

    n_companies: int
    n_rows: int
    companies: list[dict[str, Any]]
    submission_csv: str
