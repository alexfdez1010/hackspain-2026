"""End-to-end: panel -> normalised pillars -> forward models -> final score."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import polars as pl

from ml_service.xray.config import MODELS_DIR
from ml_service.xray.score.composite import composite_score, pillar_scores
from ml_service.xray.score.model import ForwardModels
from ml_service.xray.score.normalize import QuantileNormalizer
from ml_service.xray.score.regime import add_regimes
from ml_service.xray.score.scoring import final_scores, fit_calibration
from ml_service.xray.score.targets import add_targets


@dataclass
class ScoreEngine:
    """Fitted artefacts needed to score any company panel."""

    normalizer: QuantileNormalizer
    models: ForwardModels
    calibration: list[float] | None = None

    @classmethod
    def fit(cls, panel: pl.DataFrame, cross_validate: bool = True) -> ScoreEngine:
        """Fit normaliser + forward models on a training panel."""
        normalizer = QuantileNormalizer().fit(panel)
        prepared = add_targets(composite_score(pillar_scores(normalizer.transform(panel))))
        models = ForwardModels()
        if cross_validate:
            models.cross_validate(prepared)
        models.fit(prepared)
        engine = cls(normalizer=normalizer, models=models)
        engine.calibration = fit_calibration(final_scores(models.predict(prepared))["score_raw"].to_numpy())
        return engine

    def prepare(self, panel: pl.DataFrame) -> pl.DataFrame:
        """Normalise, build pillars/composite and targets (targets only where future exists)."""
        return add_targets(composite_score(pillar_scores(self.normalizer.transform(panel))))

    def score(self, panel: pl.DataFrame) -> pl.DataFrame:
        """Score a panel (train or unseen companies)."""
        scored = final_scores(self.models.predict(self.prepare(panel)), self.calibration)
        return add_regimes(scored)

    def save(self, folder: Path = MODELS_DIR) -> None:
        """Persist normaliser and boosters."""
        self.normalizer.save(folder / "normalizer.json")
        self.models.save(folder)
        (folder / "calibration.json").write_text(json.dumps(self.calibration))

    @classmethod
    def load(cls, folder: Path = MODELS_DIR) -> ScoreEngine:
        """Load a persisted engine."""
        calibration = json.loads((folder / "calibration.json").read_text())
        return cls(QuantileNormalizer.load(folder / "normalizer.json"), ForwardModels.load(folder), calibration)
