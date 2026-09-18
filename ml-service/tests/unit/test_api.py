"""Endpoint tests for the FastAPI layer, backed by an in-memory fake store."""

from __future__ import annotations

import io
import zipfile
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from ml_service.api.app import create_app
from ml_service.api.offers import compute_offer
from ml_service.api.schemas import Offer
from ml_service.api.settings import Settings

MONTHS = [f"2026-{m:02d}" for m in range(1, 9)]


def _series(
    scores: list[float], inflow: float, p_stress: float, regime: str
) -> list[dict]:
    """Build a monthly series with the fields the API reads."""
    return [
        {
            "month": MONTHS[i],
            "score": score,
            "p_stress": p_stress,
            "regime": regime,
            "direction": "improving" if score >= scores[0] else "declining",
            "pillars": {"liquidity": 0.6},
            "raw": {"inflow": inflow},
            "reasons": [],
        }
        for i, score in enumerate(scores)
    ]


def _company(
    company_id: str,
    scores: list[float],
    inflow: float,
    p_stress: float,
    regime: str = "steady",
    direction: str = "improving",
) -> dict:
    """Build one company record shaped like ``company_records`` output."""
    return {
        "company_id": company_id,
        "group_id": "G1",
        "months_observed": len(scores),
        "score": scores[-1],
        "score_prev": scores[-2],
        "score_6m_ago": scores[-7] if len(scores) > 6 else None,
        "trend_6m": scores[-1] - scores[0],
        "direction": direction,
        "regime": regime,
        "p_stress": p_stress,
        "pillars": {"liquidity": 0.6},
        "reasons": [{"feature": "cash_runway_months", "impact": 12.0}],
        "explanation": {"narrative_es": "Mejora sostenida."},
        "series": _series(scores, inflow, p_stress, regime),
    }


COMPANIES = [
    _company("COMP_0001", [50, 52, 55, 58, 62, 70, 78, 85], 100_000.0, 0.10),
    _company(
        "COMP_0002",
        [70, 68, 64, 60, 55, 48, 42, 40],
        50_000.0,
        0.45,
        regime="structural_decline",
        direction="declining",
    ),
    _company(
        "COMP_0003",
        [30, 30, 31, 30, 29, 28, 27, 25],
        10_000.0,
        0.80,
        regime="steady",
        direction="declining",
    ),
]

ALERTS = [
    {
        "company_id": "COMP_0002",
        "month": "2026-07",
        "type": "score_drop",
        "severity": "critical",
        "title_es": "Caída del score",
        "detail_es": "El score ha bajado 18 puntos.",
        "score": 42.0,
        "delta": -18.0,
    },
    {
        "company_id": "COMP_0003",
        "month": "2026-08",
        "type": "stress_risk_high",
        "severity": "warning",
        "title_es": "Riesgo elevado",
        "detail_es": "Probabilidad de tensión al 80%.",
        "score": 25.0,
        "delta": 0.8,
    },
]


class FakeStore:
    """In-memory :class:`RecordStore` implementation for tests."""

    def __init__(
        self, records: list[dict] | None = None, alerts: list[dict] | None = None
    ):
        self._records = COMPANIES if records is None else records
        self._alerts = ALERTS if alerts is None else alerts

    def companies(self) -> list[dict]:
        """All records."""
        return self._records

    def company(self, company_id: str) -> dict | None:
        """One record by id."""
        return next((r for r in self._records if r["company_id"] == company_id), None)

    def alerts(self) -> list[dict]:
        """All alerts."""
        return self._alerts

    def meta(self) -> dict[str, Any]:
        """Labels and engine metadata."""
        return {
            "pillar_labels": {"liquidity": "Liquidez"},
            "feature_labels": {"cash_runway_months": "Meses de caja disponibles"},
            "evaluation": {"meta": {"companies": 3}},
            "anticipation": {"lead_months": 3},
        }

    def health(self) -> dict[str, Any]:
        """Liveness payload."""
        return {
            "status": "ok",
            "n_companies": len(self._records),
            "models_loaded": True,
            "generated_at": "2026-09-18T20:00:00",
        }

    def submission_csv(self) -> str | None:
        """Submission CSV."""
        return "company_id,month,score\nCOMP_0001,2026-08,85.0\n"


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    """Settings pointing at an empty data folder."""
    return Settings(data_dir=tmp_path, cors_origins=("*",), api_key=None, port=8000)


@pytest.fixture
def client(settings: Settings) -> TestClient:
    """Test client wired to the fake store."""
    return TestClient(create_app(settings=settings, store=FakeStore()))


def test_health(client: TestClient) -> None:
    body = client.get("/health").json()
    assert body == {
        "status": "ok",
        "n_companies": 3,
        "models_loaded": True,
        "generated_at": "2026-09-18T20:00:00",
    }


def test_meta(client: TestClient) -> None:
    body = client.get("/api/meta").json()
    assert body["pillar_labels"]["liquidity"] == "Liquidez"
    assert body["feature_labels"]["cash_runway_months"]
    assert body["evaluation"]["meta"]["companies"] == 3
    assert body["anticipation"] == {"lead_months": 3}


def test_list_companies_defaults(client: TestClient) -> None:
    body = client.get("/api/companies").json()
    assert body["total"] == 3
    assert [c["company_id"] for c in body["items"]] == [
        "COMP_0001",
        "COMP_0002",
        "COMP_0003",
    ]
    assert "series" not in body["items"][0]
    assert body["totals"]["n_companies"] == 3
    assert body["totals"]["at_risk"] == 1
    assert body["totals"]["by_direction"] == {"improving": 1, "declining": 2}


def test_list_companies_filters_and_paging(client: TestClient) -> None:
    body = client.get(
        "/api/companies",
        params={"direction": "declining", "min_score": 30, "sort": "score", "limit": 1},
    ).json()
    assert body["total"] == 1
    assert body["items"][0]["company_id"] == "COMP_0002"
    search = client.get("/api/companies", params={"q": "0003"}).json()
    assert [c["company_id"] for c in search["items"]] == ["COMP_0003"]
    page = client.get("/api/companies", params={"limit": 1, "offset": 2}).json()
    assert page["items"][0]["company_id"] == "COMP_0003"
    assert page["offset"] == 2


def test_company_detail(client: TestClient) -> None:
    body = client.get("/api/companies/COMP_0002").json()
    assert body["company"]["company_id"] == "COMP_0002"
    assert len(body["company"]["series"]) == 8
    assert "explanation" not in body["company"]
    assert body["explanation"]["narrative_es"]
    assert [a["type"] for a in body["alerts"]] == ["score_drop"]
    assert body["offer"]["company_id"] == "COMP_0002"


def test_company_detail_unknown(client: TestClient) -> None:
    assert client.get("/api/companies/NOPE").status_code == 404


def test_movers(client: TestClient) -> None:
    body = client.get("/api/movers", params={"window": 6, "limit": 2}).json()
    assert body["window"] == 6
    assert body["improvers"][0]["company_id"] == "COMP_0001"
    assert body["improvers"][0]["delta"] == pytest.approx(33.0)
    assert body["decliners"][0]["company_id"] == "COMP_0002"
    assert body["decliners"][0]["delta"] < 0


def test_alerts_listing_and_filters(client: TestClient) -> None:
    body = client.get("/api/alerts").json()
    assert body["total"] == 2
    filtered = client.get("/api/alerts", params={"severity": "critical"}).json()
    assert [a["company_id"] for a in filtered["items"]] == ["COMP_0002"]
    by_month = client.get("/api/alerts", params={"month": "2026-08"}).json()
    assert by_month["total"] == 1
    by_type = client.get("/api/alerts", params={"type": "stress_risk_high"}).json()
    assert by_type["total"] == 1


def test_alert_counts(client: TestClient) -> None:
    body = client.get("/api/alerts/counts").json()
    assert body["total"] == 2
    assert body["by_severity"] == {"critical": 1, "warning": 1}
    assert body["by_month"] == {"2026-07": 1, "2026-08": 1}


def test_offers_listing(client: TestClient) -> None:
    body = client.get("/api/offers", params={"limit": 3}).json()
    assert body["total"] == 3
    assert body["items"][0]["company_id"] == "COMP_0001"
    assert body["totals"]["n_offers"] == 3
    assert body["totals"]["by_status"]["preaprobada"] >= 1
    closed = client.get("/api/offers", params={"status": "cerrada"}).json()
    assert all(o["status"] == "cerrada" for o in closed["items"])


def test_offer_detail_history(client: TestClient) -> None:
    body = client.get("/api/offers/COMP_0001").json()
    assert body["offer"]["status"] == "preaprobada"
    assert len(body["history"]) == 8
    assert body["history"][-1]["limit"] == body["offer"]["limit"]
    assert client.get("/api/offers/NOPE").status_code == 404


def test_submission_csv(client: TestClient) -> None:
    response = client.get("/api/submission.csv")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert response.text.startswith("company_id,month,score")


def test_score_path_rejects_bad_directory(client: TestClient) -> None:
    response = client.post("/api/score/path", json={"raw_dir": "/definitely/not/here"})
    assert response.status_code == 400


def test_score_upload_rejects_incomplete_zip(client: TestClient) -> None:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("transactions.csv", "transaction_id\n")
    response = client.post(
        "/api/score", files={"file": ("data.zip", buffer.getvalue(), "application/zip")}
    )
    assert response.status_code == 400
    assert "Missing required tables" in response.json()["detail"]


def test_score_upload_rejects_non_zip(client: TestClient) -> None:
    response = client.post(
        "/api/score", files={"file": ("x.zip", b"not a zip", "application/zip")}
    )
    assert response.status_code == 400


def test_api_key_guards_post_endpoints(settings: Settings) -> None:
    guarded = Settings(
        data_dir=settings.data_dir, cors_origins=("*",), api_key="secret", port=8000
    )
    with TestClient(create_app(settings=guarded, store=FakeStore())) as guarded_client:
        assert guarded_client.get("/health").status_code == 200
        assert (
            guarded_client.post("/api/score/path", json={"raw_dir": "/tmp"}).status_code
            == 401
        )
        authorised = guarded_client.post(
            "/api/score/path",
            json={"raw_dir": "/definitely/not/here"},
            headers={"Authorization": "Bearer secret"},
        )
        assert authorised.status_code == 400


def test_cors_headers(client: TestClient) -> None:
    response = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


@pytest.mark.parametrize(
    "score, p_stress, regime, expected_k, expected_status",
    [
        (85.0, 0.05, "steady", 1.0, "preaprobada"),
        (70.0, 0.10, "steady", 0.8, "preaprobada"),
        (55.0, 0.20, "steady", 0.5, "preaprobada"),
        (40.0, 0.20, "steady", 0.25, "en_vigilancia"),
        (20.0, 0.20, "steady", 0.0, "cerrada"),
        (70.0, 0.10, "structural_decline", 0.4, "preaprobada"),
        (70.0, 0.10, "structural_improvement", 0.92, "preaprobada"),
        (85.0, 0.05, "structural_improvement", 1.0, "preaprobada"),
        (70.0, 0.40, "steady", 0.8, "en_vigilancia"),
        (70.0, 0.70, "steady", 0.8, "cerrada"),
    ],
)
def test_compute_offer_formula(
    score: float, p_stress: float, regime: str, expected_k: float, expected_status: str
) -> None:
    company = _company("COMP_X", [score] * 8, 100_000.0, p_stress, regime=regime)
    offer: Offer = compute_offer(company)
    assert offer.k == pytest.approx(expected_k)
    assert offer.avg_monthly_inflow_3m == pytest.approx(100_000.0)
    assert offer.limit == pytest.approx(expected_k * 100_000.0)
    assert offer.spread_bps == 250 + round(1200 * p_stress)
    assert offer.status == expected_status
    assert offer.month == MONTHS[-1]


def test_compute_offer_clamps_limit() -> None:
    company = _company("COMP_BIG", [90.0] * 8, 9_000_000.0, 0.05)
    assert compute_offer(company).limit == pytest.approx(2_000_000.0)


def test_compute_offer_without_series() -> None:
    offer = compute_offer({"company_id": "COMP_EMPTY", "score": 90.0, "p_stress": 0.1})
    assert offer.limit == 0.0
    assert offer.month is None
    assert offer.status == "preaprobada"
