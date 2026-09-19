"""Horizons, model hyper-parameters and artefact names for the forecast layer."""

from __future__ import annotations

HORIZONS: tuple[int, ...] = (1, 2, 3, 4, 5, 6)
BIG_MOVE = 15.0  # points; used by the evaluation to define "large" changes
QUANTILE_LOW, QUANTILE_HIGH = 0.1, 0.9

POINT_PARAMS: dict = {
    "objective": "huber",
    "learning_rate": 0.03,
    "num_leaves": 15,
    "min_data_in_leaf": 80,
    "feature_fraction": 0.6,
    "bagging_fraction": 0.8,
    "bagging_freq": 1,
    "lambda_l2": 5.0,
    "verbose": -1,
    "num_threads": 8,
}
POINT_ROUNDS = 600
QUANTILE_ROUNDS = 300

RETURNED_DEBIT_REGEX = (
    r"(?i)impagad|devoluci[oó]n recibo|devol\.? recibo|recibo devuelto|adeudo devuelto"
)
STRESS_EVENT_REGEX = (
    r"(?i)descubierto|excedido|int(\.|ereses)? deudor|demora|recargo|embargo"
)
