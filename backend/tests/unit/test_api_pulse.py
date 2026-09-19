"""Unit tests for the PULSE API routes, served from a temporary web export."""

import json
from pathlib import Path

from fastapi.testclient import TestClient

from ml_service.api.app import create_app
from ml_service.api.settings import Settings


def _app(tmp_path: Path) -> TestClient:
    web = tmp_path / "pulse" / "web" / "companies"
    web.mkdir(parents=True)
    (web.parent / "summary.json").write_text(
        json.dumps({"companies": [{"company_id": "C1"}]})
    )
    (web / "C1.json").write_text(
        json.dumps({"company_id": "C1", "series": [], "forecast": []})
    )
    settings = Settings(
        data_dir=tmp_path,
        cors_origins=("http://localhost:3000",),
        port=8000,
    )
    return TestClient(create_app(settings=settings, routers=()))


def test_summary_and_company_are_served_from_the_export(tmp_path: Path):
    from ml_service.api import routes_pulse

    client = _app(tmp_path)
    client.app.include_router(routes_pulse.router)
    assert client.get("/api/pulse/summary").json()["companies"][0]["company_id"] == "C1"
    assert client.get("/api/pulse/companies/C1").json()["company_id"] == "C1"
    assert client.get("/api/pulse/companies/unknown").status_code == 404
    assert client.get("/api/pulse/companies/..%2Fsummary").status_code == 404


def test_health_reports_the_export_state(tmp_path: Path):
    from ml_service.api import routes_meta

    client = _app(tmp_path)
    client.app.include_router(routes_meta.router)
    payload = client.get("/health").json()
    assert payload["status"] == "ok"
    assert payload["n_companies"] == 1
    assert payload["recommendations_loaded"] is False

    empty = TestClient(
        create_app(
            settings=Settings(
                data_dir=tmp_path / "missing", cors_origins=("http://x",)
            ),
            routers=(routes_meta.router,),
        )
    )
    assert empty.get("/health").json()["status"] == "degraded"
