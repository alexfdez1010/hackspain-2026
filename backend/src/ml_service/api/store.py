"""Artefact store: everything the read-only endpoints serve, loaded once."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Protocol, runtime_checkable

from ml_service.api import loaders
from ml_service.api.settings import Settings
from ml_service.xray.config import FEATURE_SPECS, PILLAR_LABELS_ES


@runtime_checkable
class RecordStore(Protocol):
    """Read model backing the API; tests inject a fake implementation."""

    def companies(self) -> list[dict]:
        """All company records, each including its monthly ``series``."""
        ...

    def company(self, company_id: str) -> dict | None:
        """One company record, or ``None`` when unknown."""
        ...

    def alerts(self) -> list[dict]:
        """Every monitoring alert, newest last."""
        ...

    def meta(self) -> dict[str, Any]:
        """Labels plus evaluation and anticipation blocks."""
        ...

    def health(self) -> dict[str, Any]:
        """Liveness payload."""
        ...

    def submission_csv(self) -> str | None:
        """Training-set submission CSV, or ``None`` when unavailable."""
        ...


@dataclass
class ArtefactStore:
    """Store reading the precomputed web export, else the scored panel.

    Attributes:
        records: Company records including their monthly series.
        alert_rows: Alerts produced by the monitoring rules.
        summary: Export summary (``data/output/web/summary.json``).
        evaluation: Report from ``data/output/evaluation.json``.
        anticipation: Anticipation block, from the summary or its own file.
        models_loaded: Whether the persisted scoring artefacts are present.
        generated_at: ISO timestamp of the loaded artefacts.
    """

    records: list[dict] = field(default_factory=list)
    alert_rows: list[dict] = field(default_factory=list)
    summary: dict[str, Any] = field(default_factory=dict)
    evaluation: dict[str, Any] | None = None
    anticipation: dict[str, Any] | None = None
    models_loaded: bool = False
    generated_at: str | None = None
    _index: dict[str, dict] = field(default_factory=dict, repr=False)
    _settings: Settings | None = field(default=None, repr=False)

    def __post_init__(self) -> None:
        """Index the records by company id."""
        self._index = {str(r.get("company_id")): r for r in self.records}

    @classmethod
    def load(cls, settings: Settings) -> ArtefactStore:
        """Build the store from the artefacts found under the data folder."""
        summary = loaders.read_json(settings.web_dir / "summary.json") or {}
        records = loaders.load_web_records(settings.web_dir)
        scored_path = settings.output_dir / "scored_panel.parquet"
        if not records:
            records = loaders.load_parquet_records(scored_path)
        anticipation = summary.get("anticipation") or loaders.read_json(
            settings.output_dir / "anticipation.json"
        )
        return cls(
            records=records,
            alert_rows=loaders.load_alerts(settings.web_dir, summary, scored_path),
            summary=summary if isinstance(summary, dict) else {},
            evaluation=loaders.read_json(settings.output_dir / "evaluation.json"),
            anticipation=anticipation if isinstance(anticipation, dict) else None,
            models_loaded=loaders.models_present(settings.models_dir),
            generated_at=summary.get("generated_at")
            or datetime.now(tz=UTC).isoformat(timespec="seconds"),
            _settings=settings,
        )

    def companies(self) -> list[dict]:
        """All company records."""
        return self.records

    def company(self, company_id: str) -> dict | None:
        """One company record by id."""
        return self._index.get(company_id)

    def alerts(self) -> list[dict]:
        """Every alert."""
        return self.alert_rows

    def meta(self) -> dict[str, Any]:
        """Labels plus evaluation and anticipation blocks."""
        return {
            "pillar_labels": dict(PILLAR_LABELS_ES),
            "feature_labels": {spec.name: spec.label_es for spec in FEATURE_SPECS},
            "evaluation": self.evaluation,
            "anticipation": self.anticipation,
        }

    def health(self) -> dict[str, Any]:
        """Liveness payload."""
        return {
            "status": "ok" if self.records else "degraded",
            "n_companies": len(self.records),
            "models_loaded": self.models_loaded,
            "generated_at": self.generated_at,
        }

    def submission_csv(self) -> str | None:
        """Training-set submission CSV."""
        if self._settings is None:
            return None
        return loaders.load_submission_csv(self._settings.output_dir)
