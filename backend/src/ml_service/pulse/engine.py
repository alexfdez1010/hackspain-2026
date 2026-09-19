"""PulseEngine: fit on a panel, freeze normaliser + calibration, score any panel identically."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import polars as pl

from ml_service.pulse.normalize import Normalizer
from ml_service.pulse.score import (
    Calibration,
    apply_calibration,
    contributions,
    variable_scores,
    weighted_score,
)

NORMALIZER_FILE = "normalizer.json"
CALIBRATION_FILE = "calibration.json"


@dataclass
class PulseEngine:
    """Frozen artefacts that turn a raw-variable panel into PULSE scores."""

    normalizer: Normalizer
    calibration: Calibration

    @classmethod
    def fit(cls, panel: pl.DataFrame) -> PulseEngine:
        normalizer = Normalizer().fit(panel)
        scored = weighted_score(variable_scores(normalizer.transform(panel)))
        calibration = Calibration().fit(scored["pulse_raw"].to_numpy().astype(float))
        return cls(normalizer, calibration)

    def score(self, panel: pl.DataFrame) -> pl.DataFrame:
        """Per-company computation: nothing here depends on the other rows of ``panel``."""
        scored = weighted_score(variable_scores(self.normalizer.transform(panel)))
        scored = contributions(scored)
        return apply_calibration(scored, self.calibration)

    def save(self, models_dir: Path) -> None:
        models_dir.mkdir(parents=True, exist_ok=True)
        self.normalizer.save(models_dir / NORMALIZER_FILE)
        self.calibration.save(models_dir / CALIBRATION_FILE)

    @classmethod
    def load(cls, models_dir: Path) -> PulseEngine:
        return cls(
            Normalizer.load(models_dir / NORMALIZER_FILE),
            Calibration.load(models_dir / CALIBRATION_FILE),
        )
