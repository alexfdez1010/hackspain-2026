"""Re-price PULSE Advisor recommendations on request, for a caller-supplied reference rate.

The static export is priced over the configured Euríbor. When a request passes
``euribor``, the snapshots saved by ``recommend.export`` and the frozen risk
model are loaded once per process and the recommendation is recomputed; only
the reference line of the price changes, the spreads are identical.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from fastapi import HTTPException, Request

from ml_service.pulse.recommend.engine import Recommender, summary_row
from ml_service.pulse.recommend.export import SNAPSHOTS_FILE
from ml_service.pulse.recommend.risk import RiskModel
from ml_service.pulse.recommend.snapshot import CompanySnapshot

STATE_KEY = "advisor_runtime"


@dataclass
class AdvisorRuntime:
    """Snapshots + risk model, enough to recommend for any reference rate."""

    recommender: Recommender
    snapshots: dict[str, CompanySnapshot] = field(default_factory=dict)

    @classmethod
    def load(cls, data_dir: Path) -> AdvisorRuntime:
        reco_dir = data_dir / "pulse" / "recommendations"
        model_file = data_dir / "pulse" / "models" / "risk_model.json"
        snapshots_file = reco_dir / SNAPSHOTS_FILE
        if not model_file.exists() or not snapshots_file.exists():
            raise HTTPException(
                status_code=404,
                detail="Re-pricing needs risk_model.json and snapshots.json; run recommend.cli build",
            )
        raw = json.loads(snapshots_file.read_text())
        snaps = {row["company_id"]: CompanySnapshot.from_dict(row) for row in raw}
        return cls(Recommender(RiskModel.load(model_file)), snaps)

    def company(self, company_id: str, reference_rate: float) -> dict:
        snap = self.snapshots.get(company_id)
        if snap is None:
            raise HTTPException(status_code=404, detail=f"{company_id} not found")
        return self.recommender.recommend(snap, reference_rate)

    def portfolio(self, reference_rate: float) -> list[dict]:
        return [
            summary_row(self.recommender.recommend(s, reference_rate))
            for s in self.snapshots.values()
        ]


def get_runtime(request: Request) -> AdvisorRuntime:
    """Return the process-wide runtime, loading it on first use."""
    runtime = getattr(request.app.state, STATE_KEY, None)
    if runtime is None:
        runtime = AdvisorRuntime.load(request.app.state.settings.data_dir)
        setattr(request.app.state, STATE_KEY, runtime)
    return runtime
