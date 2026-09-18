"""Forward-looking LightGBM models with monotone constraints and group-wise CV."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import lightgbm as lgb
import numpy as np
import polars as pl
from sklearn.model_selection import GroupKFold

from ml_service.xray.config import FEATURE_SPECS

MODEL_FEATURES: tuple[str, ...] = tuple(s.name for s in FEATURE_SPECS) + (
    "months_observed",
    "composite",
    "pillar_liquidity",
    "pillar_cashflow",
    "pillar_payments",
    "pillar_receivables",
    "pillar_debt",
    "pillar_activity",
)
MONOTONE = {s.name: s.direction for s in FEATURE_SPECS}
MONOTONE.update({c: 1 for c in MODEL_FEATURES if c.startswith(("composite", "pillar_"))})
MONOTONE["months_observed"] = 0
# Growth / margin signals mean-revert, so the future-composite regressor is left
# free on them; the stress classifier keeps every constraint for explainability.
FREE_FOR_FUTURE = {c for c in MODEL_FEATURES if "growth" in c} | {
    "net_margin", "net_margin_3m", "inflow_volatility", "customer_concentration",
    "pillar_cashflow", "pillar_activity",
}

BASE_PARAMS = {
    "learning_rate": 0.03,
    "num_leaves": 15,
    "min_child_samples": 60,
    "feature_fraction": 0.8,
    "bagging_fraction": 0.8,
    "bagging_freq": 1,
    "lambda_l2": 5.0,
    "verbose": -1,
    "seed": 42,
}
N_ROUNDS = 400
N_FOLDS = 5


def _matrix(df: pl.DataFrame) -> np.ndarray:
    return df.select(MODEL_FEATURES).to_numpy().astype(float)


def _params(objective: str, sign: int, free: set[str] = frozenset()) -> dict:
    mono = [0 if c in free else MONOTONE.get(c, 0) * sign for c in MODEL_FEATURES]
    return {**BASE_PARAMS, "objective": objective, "monotone_constraints": mono}


@dataclass
class ForwardModels:
    """Pair of models: P(stress in next H months) and E[composite at t+H]."""

    stress: lgb.Booster | None = None
    future: lgb.Booster | None = None
    oof: pl.DataFrame | None = None
    metrics: dict[str, float] = field(default_factory=dict)

    def fit(self, train: pl.DataFrame) -> ForwardModels:
        """Train both boosters on rows where the full horizon is observable."""
        rows = train.filter(pl.col("has_future"))
        x = _matrix(rows)
        self.stress = lgb.train(
            _params("binary", -1), lgb.Dataset(x, rows["y_stress"].cast(pl.Int32).to_numpy()), N_ROUNDS
        )
        self.future = lgb.train(
            _params("regression", 1, FREE_FOR_FUTURE),
            lgb.Dataset(x, rows["y_future_composite"].to_numpy()),
            N_ROUNDS,
        )
        return self

    def predict(self, panel: pl.DataFrame) -> pl.DataFrame:
        """Append ``p_stress`` and ``pred_future_composite`` columns."""
        x = _matrix(panel)
        return panel.with_columns(
            pl.Series("p_stress", self.stress.predict(x)),
            pl.Series("pred_future_composite", np.clip(self.future.predict(x), 0, 100)),
        )

    def cross_validate(self, train: pl.DataFrame) -> ForwardModels:
        """Group-wise out-of-fold predictions so unseen companies are scored honestly."""
        rows = train.filter(pl.col("has_future")).with_row_index("_i")
        groups = rows["group_id"].to_numpy()
        p_stress = np.zeros(rows.height)
        p_future = np.zeros(rows.height)
        for tr, va in GroupKFold(N_FOLDS).split(rows, groups=groups):
            fold = ForwardModels().fit(rows[tr])
            x = _matrix(rows[va])
            p_stress[va] = fold.stress.predict(x)
            p_future[va] = fold.future.predict(x)
        self.oof = rows.with_columns(pl.Series("p_stress", p_stress), pl.Series("pred_future_composite", p_future))
        return self

    def save(self, folder: Path) -> None:
        """Write both boosters to ``folder``."""
        folder.mkdir(parents=True, exist_ok=True)
        self.stress.save_model(str(folder / "stress.txt"))
        self.future.save_model(str(folder / "future.txt"))

    @classmethod
    def load(cls, folder: Path) -> ForwardModels:
        """Load boosters written by :meth:`save`."""
        return cls(
            stress=lgb.Booster(model_file=str(folder / "stress.txt")),
            future=lgb.Booster(model_file=str(folder / "future.txt")),
        )
