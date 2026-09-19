"""Will this episode last? One transparent logistic model per direction.

Inputs are what is known the month the signal opens: the level, the size of
the move, how many pillars moved, the data confidence, the past volatility
and each pillar's own move. The output is the probability that, three months
later, the score is still away from its baseline: a «caída» (or «mejora»)
rather than a «bache» (or «repunte»).
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import polars as pl
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import GroupKFold

from ml_service.pulse.variables import PILLARS

FEATURES: tuple[str, ...] = (
    "level",
    "move",
    "breadth",
    "confidence",
    "volatility",
    *(f"delta_{p}" for p in PILLARS),
)
DIRECTIONS = {"down": -1, "up": 1}
C_REGULARISATION = 0.5
N_FOLDS = 5
MIN_ROWS = 50


def feature_matrix(signals: pl.DataFrame) -> np.ndarray:
    """Inputs in ``FEATURES`` order, NaN-free."""
    return np.nan_to_num(signals.select(FEATURES).to_numpy().astype(float))


@dataclass
class DirectionModel:
    """Standardised logistic regression for one direction of move."""

    mean: list[float] = field(default_factory=list)
    std: list[float] = field(default_factory=list)
    coef: list[float] = field(default_factory=list)
    intercept: float = 0.0
    evaluation: dict = field(default_factory=dict)

    def _fit(self, x: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, float]:
        clf = LogisticRegression(C=C_REGULARISATION, max_iter=2000)
        clf.fit((x - self.mean) / self.std, y)
        return clf.coef_[0], float(clf.intercept_[0])

    def _predict(self, coef, intercept: float, x: np.ndarray) -> np.ndarray:
        logit = ((x - self.mean) / self.std) @ coef + intercept
        return 1.0 / (1.0 + np.exp(-logit))

    def fit(self, x: np.ndarray, y: np.ndarray, groups: np.ndarray) -> DirectionModel:
        """Fit on every labelled signal after a grouped out-of-fold AUROC."""
        self.mean = x.mean(axis=0).tolist()
        self.std = np.where(x.std(axis=0) > 0, x.std(axis=0), 1.0).tolist()
        oof = np.full(len(y), np.nan)
        folds = min(N_FOLDS, len(np.unique(groups)))
        for train, test in GroupKFold(folds).split(x, y, groups):
            coef, intercept = self._fit(x[train], y[train])
            oof[test] = self._predict(coef, intercept, x[test])
        coef, intercept = self._fit(x, y)
        self.coef, self.intercept = coef.tolist(), intercept
        self.evaluation = {
            "signals": len(y),
            "persistent_share": round(float(y.mean()), 4),
            "oof_auroc": round(float(roc_auc_score(y, oof)), 4),
            "coefficients_std": dict(zip(FEATURES, [round(c, 4) for c in self.coef])),
        }
        return self

    def probability(self, x: np.ndarray) -> np.ndarray:
        """Probability of persistence for each row of ``x``."""
        return self._predict(np.asarray(self.coef), self.intercept, x)


@dataclass
class PersistenceModel:
    """The two direction models, saved together as one JSON file."""

    down: DirectionModel = field(default_factory=DirectionModel)
    up: DirectionModel = field(default_factory=DirectionModel)

    @classmethod
    def fit(cls, signals: pl.DataFrame) -> PersistenceModel:
        """Fit each direction on the signals whose outcome is already known."""
        model = cls()
        labelled = signals.filter(pl.col("persistent").is_not_null())
        for name, direction in DIRECTIONS.items():
            part = labelled.filter(pl.col("direction") == direction)
            if part.height < MIN_ROWS or part["persistent"].n_unique() < 2:
                raise ValueError(f"not enough labelled {name} signals to fit")
            getattr(model, name).fit(
                feature_matrix(part),
                part["persistent"].cast(pl.Int32).to_numpy(),
                part["company_id"].to_numpy(),
            )
        return model

    def score(self, signals: pl.DataFrame) -> pl.DataFrame:
        """Add ``p_persistent`` to every signal."""
        if signals.height == 0:
            return signals.with_columns(
                pl.lit(None, dtype=pl.Float64).alias("p_persistent")
            )
        x = feature_matrix(signals)
        direction = signals["direction"].to_numpy()
        p = np.where(direction < 0, self.down.probability(x), self.up.probability(x))
        return signals.with_columns(pl.Series("p_persistent", np.round(p, 4)))

    def evaluation(self) -> dict:
        return {"down": self.down.evaluation, "up": self.up.evaluation}

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "features": list(FEATURES),
            "down": self.down.__dict__,
            "up": self.up.__dict__,
        }
        path.write_text(json.dumps(payload, indent=1))

    @classmethod
    def load(cls, path: Path) -> PersistenceModel:
        data = json.loads(path.read_text())
        return cls(down=DirectionModel(**data["down"]), up=DirectionModel(**data["up"]))
