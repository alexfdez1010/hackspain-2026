"""Horizons, model hyper-parameters and artefact names for the forecast layer."""

from __future__ import annotations

MAX_HORIZON = 12
HORIZONS: tuple[int, ...] = tuple(range(1, MAX_HORIZON + 1))
HORIZON_FEATURE = "horizon"  # the single model reads the horizon as an input
BIG_MOVE = 15.0  # points; used by the evaluation to define "large" changes
QUANTILE_LOW, QUANTILE_HIGH = 0.1, 0.9
N_FOLDS = 5  # GroupKFold folds used both for the evaluation and for the band

POINT_PARAMS: dict = {
    "objective": "huber",
    "learning_rate": 0.03,
    "num_leaves": 31,
    "min_data_in_leaf": 100,
    "feature_fraction": 0.6,
    "bagging_fraction": 0.8,
    "bagging_freq": 1,
    "lambda_l2": 5.0,
    "verbose": -1,
    "num_threads": 8,
}
POINT_ROUNDS = 800

RETURNED_DEBIT_REGEX = (
    r"(?i)impagad|devoluci[oó]n recibo|devol\.? recibo|recibo devuelto|adeudo devuelto"
)
STRESS_EVENT_REGEX = (
    r"(?i)descubierto|excedido|int(\.|ereses)? deudor|demora|recargo|embargo"
)
