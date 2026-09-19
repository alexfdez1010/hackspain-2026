"""Unit tests for the PULSE Advisor API routes, served from a temporary export."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from ml_service.api import routes_recommend
from ml_service.api.app import create_app
from ml_service.api.settings import Settings


def _client(tmp_path: Path) -> TestClient:
    out = tmp_path / "pulse" / "recommendations" / "companies"
    out.mkdir(parents=True)
    rows = [
        {"company_id": "C1", "top_product": "credit_line", "top_fit": 70.0},
        {"company_id": "C2", "top_product": None, "top_fit": None},
        {"company_id": "C3", "top_product": "credit_line", "top_fit": 90.0},
    ]
    (out.parent / "summary.json").write_text(
        json.dumps(
            {"reference_rate": {"value": 0.021}, "products": [], "companies": rows}
        )
    )
    (out / "C1.json").write_text(
        json.dumps({"company_id": "C1", "recommendations": []})
    )
    settings = Settings(
        data_dir=tmp_path,
        cors_origins=("http://localhost:3000",),
        port=8000,
    )
    client = TestClient(create_app(settings=settings, routers=()))
    client.app.include_router(routes_recommend.router)
    return client


def test_portfolio_filters_sorts_and_counts(tmp_path: Path):
    client = _client(tmp_path)
    body = client.get("/api/pulse/recommendations").json()
    assert [r["company_id"] for r in body["items"]] == ["C3", "C1", "C2"]
    assert body["by_top_product"] == {"credit_line": 2, "ninguno": 1}
    filtered = client.get(
        "/api/pulse/recommendations", params={"product": "credit_line", "limit": 1}
    ).json()
    assert filtered["total"] == 2 and len(filtered["items"]) == 1


def test_euribor_override_reprices_from_snapshots(tmp_path: Path):
    from test_pulse_recommend import model, snapshot

    from ml_service.pulse.recommend.risk import RiskModel

    client = _client(tmp_path)
    snap = snapshot(company_id="C1")
    (tmp_path / "pulse" / "recommendations" / "snapshots.json").write_text(
        json.dumps([snap.to_dict()])
    )
    model().save(tmp_path / "pulse" / "models" / "risk_model.json")
    body = client.get("/api/pulse/recommendations/C1", params={"euribor": 0.03}).json()
    assert body["reference_rate"] == {
        "label": "Euríbor 12 m",
        "value": 0.03,
        "source": "request",
    }
    top = body["recommendations"][0]
    assert top["annual_rate"] == pytest.approx(0.03 + top["spread_bps"] / 1e4, abs=1e-4)
    listing = client.get("/api/pulse/recommendations", params={"euribor": 0.03}).json()
    assert (
        listing["reference_rate"]["value"] == 0.03
        and listing["items"][0]["company_id"] == "C1"
    )
    assert listing["items"][0]["top_annual_rate"] == top["annual_rate"]
    assert (
        client.get(
            "/api/pulse/recommendations/C9", params={"euribor": 0.03}
        ).status_code
        == 404
    )
    assert isinstance(
        RiskModel.load(tmp_path / "pulse" / "models" / "risk_model.json"), RiskModel
    )


def test_euribor_override_without_snapshots_is_a_clear_404(tmp_path: Path):
    client = _client(tmp_path)
    response = client.get("/api/pulse/recommendations/C1", params={"euribor": 0.03})
    assert response.status_code == 404 and "snapshots.json" in response.json()["detail"]


def test_catalogue_and_company_routes(tmp_path: Path):
    client = _client(tmp_path)
    catalogue = client.get("/api/pulse/recommendations/catalogue").json()
    assert (
        "companies" not in catalogue and catalogue["reference_rate"]["value"] == 0.021
    )
    assert client.get("/api/pulse/recommendations/C1").json()["company_id"] == "C1"
    assert client.get("/api/pulse/recommendations/nope").status_code == 404
    assert client.get("/api/pulse/recommendations/..%2Fsummary").status_code == 404
