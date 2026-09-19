"""PulseEngine: fit the normaliser on a panel, freeze it, score any panel identically."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import polars as pl

from ml_service.pulse.normalize import Normalizer
from ml_service.pulse.score import contributions, variable_scores, weighted_score

NORMALIZER_FILE = "normalizer.json"


@dataclass
class PulseEngine:
    """Frozen artefacts that turn a raw-variable panel into PULSE scores.

    PULSE is the weighted mean of the known variables (``weighted_score``); no
    further calibration is applied, so a score reads directly in the 0-100
    scale of the variables and the contributions sum to it exactly.
    """

    normalizer: Normalizer

    @classmethod
    def fit(cls, panel: pl.DataFrame) -> PulseEngine:
        return cls(Normalizer().fit(panel))

    def score(self, panel: pl.DataFrame) -> pl.DataFrame:
        """Per-company computation: nothing here depends on the other rows of ``panel``."""
        scored = weighted_score(variable_scores(self.normalizer.transform(panel)))
        return contributions(scored)

    def save(self, models_dir: Path) -> None:
        models_dir.mkdir(parents=True, exist_ok=True)
        self.normalizer.save(models_dir / NORMALIZER_FILE)

    @classmethod
    def load(cls, models_dir: Path) -> PulseEngine:
        return cls(Normalizer.load(models_dir / NORMALIZER_FILE))
