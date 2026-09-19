"""Probability of bank stress in the next six months, as a transparent logistic scorecard.

The model is deliberately small: the four PULSE pillars, the data confidence
and the observation length. Being linear in log-odds, every prediction
decomposes exactly into one additive term per input, which is what the company
sees as "why your risk premium is what it is". Every input is "more is
healthier", so a coefficient that comes out positive is treated as no signal
and set to zero: improving a pillar can never raise the premium.
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

from ml_service.pulse.recommend.snapshot import CompanySnapshot
from ml_service.pulse.variables import PILLARS

NEUTRAL_PILLAR = 50.0
FEATURES: tuple[str, ...] = (
    *(f"pillar_{p}" for p in PILLARS),
    "confidence",
    "log_months",
)
LABELS_ES = {
    "pillar_liquidez": "Pilar liquidez",
    "pillar_deuda": "Pilar deuda y servicio",
    "pillar_pago": "Pilar comportamiento de pago",
    "pillar_cobro": "Pilar calidad de cobro",
    "confidence": "Cobertura de datos",
    "log_months": "Meses de historial",
}
C_REGULARISATION = 0.5
N_FOLDS = 5


def feature_frame(df: pl.DataFrame) -> pl.DataFrame:
    """Model inputs from a scored panel (unknown pillars sit at the neutral 50)."""
    return df.select(
        *(pl.col(f"pillar_{p}").fill_null(NEUTRAL_PILLAR) for p in PILLARS),
        pl.col("confidence"),
        pl.col("months_observed").cast(pl.Float64).log1p().alias("log_months"),
    )


def snapshot_features(s: CompanySnapshot) -> np.ndarray:
    """The same inputs for one snapshot, in ``FEATURES`` order."""
    pillars = [
        s.pillars.get(p) if s.pillars.get(p) is not None else NEUTRAL_PILLAR
        for p in PILLARS
    ]
    return np.array([*pillars, s.confidence, np.log1p(s.months_observed)], dtype=float)


@dataclass
class RiskModel:
    """Standardised logistic regression with exact per-feature log-odds contributions."""

    mean: list[float] = field(default_factory=list)
    std: list[float] = field(default_factory=list)
    coef: list[float] = field(default_factory=list)
    intercept: float = 0.0
    base_rate: float = 0.0
    evaluation: dict = field(default_factory=dict)

    def _fit_arrays(self, x: np.ndarray, y: np.ndarray) -> tuple[np.ndarray, float]:
        """Fit and drop (zero) any feature whose sign says 'healthier is riskier'."""
        active = np.ones(x.shape[1], dtype=bool)
        z = (x - self.mean) / self.std
        while True:
            clf = LogisticRegression(C=C_REGULARISATION, max_iter=1000)
            clf.fit(z[:, active], y)
            coef = np.zeros(x.shape[1])
            coef[active] = clf.coef_[0]
            wrong = active & (coef > 0)
            if not wrong.any():
                return coef, float(clf.intercept_[0])
            active &= ~wrong

    def _predict(self, coef: np.ndarray, intercept: float, x: np.ndarray) -> np.ndarray:
        logit = ((x - self.mean) / self.std) @ coef + intercept
        return 1.0 / (1.0 + np.exp(-logit))

    def fit(self, x: np.ndarray, y: np.ndarray, groups: np.ndarray) -> RiskModel:
        """Fit on all rows after a GroupKFold estimate of out-of-fold AUROC."""
        self.mean = x.mean(axis=0).tolist()
        self.std = np.where(x.std(axis=0) > 0, x.std(axis=0), 1.0).tolist()
        oof = np.full(len(y), np.nan)
        for train, test in GroupKFold(N_FOLDS).split(x, y, groups):
            coef, intercept = self._fit_arrays(x[train], y[train])
            oof[test] = self._predict(coef, intercept, x[test])
        coef, intercept = self._fit_arrays(x, y)
        self.coef = coef.tolist()
        self.intercept = intercept
        self.base_rate = float(y.mean())
        self.evaluation = {
            "rows": len(y),
            "stress_rate": round(self.base_rate, 4),
            "oof_auroc": round(float(roc_auc_score(y, oof)), 4),
            "mean_predicted": round(float(oof.mean()), 4),
            "coefficients_std": dict(zip(FEATURES, [round(c, 4) for c in self.coef])),
        }
        return self

    def logits(self, x: np.ndarray) -> tuple[float, np.ndarray]:
        z = (np.asarray(x, dtype=float) - self.mean) / self.std
        terms = z * np.asarray(self.coef)
        return self.intercept + float(terms.sum()), terms

    def probability(self, x: np.ndarray) -> float:
        logit, _ = self.logits(x)
        return float(1.0 / (1.0 + np.exp(-logit)))

    def explain(self, x: np.ndarray) -> dict:
        """Probability plus each feature's log-odds term (they sum to the logit)."""
        logit, terms = self.logits(x)
        return {
            "p_stress_6m": round(float(1.0 / (1.0 + np.exp(-logit))), 4),
            "base_rate": round(self.base_rate, 4),
            "contributions": [
                {
                    "feature": f,
                    "label": LABELS_ES[f],
                    "value": round(float(v), 4),
                    "logit": round(float(t), 4),
                }
                for f, v, t in sorted(zip(FEATURES, x, terms), key=lambda item: item[2])
            ],
        }

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            json.dumps({"features": list(FEATURES), **self.__dict__}, indent=1)
        )

    @classmethod
    def load(cls, path: Path) -> RiskModel:
        data = json.loads(path.read_text())
        data.pop("features", None)
        return cls(**data)
