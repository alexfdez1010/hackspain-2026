"""Horizons, model hyper-parameters and artefact names for the forecast layer."""

from __future__ import annotations

MAX_HORIZON = 6
HORIZONS: tuple[int, ...] = tuple(range(1, MAX_HORIZON + 1))
HORIZON_FEATURE = "horizon"  # the single model reads the horizon as an input
BIG_MOVE = 15.0  # points; used by the evaluation to define "large" changes
QUANTILE_LOW, QUANTILE_HIGH = 0.1, 0.9
N_FOLDS = 5  # GroupKFold folds used both for the evaluation and for the band

# ``alpha`` is the Huber threshold in points of PULSE. LightGBM's default (0.9) is
# far below the target's scale (std 9 at +1, 15 at +6): every gradient gets clipped,
# the leaves shrink towards zero and the trees stop splitting on the horizon past
# +3, which draws a flat line from there on. 6 keeps the robustness to outliers
# while letting the far horizons move (see the README evaluation table).
# ``seed`` + ``deterministic`` + ``force_row_wise`` make two runs on the same data
# write byte-identical forecasts (multithreaded histogram building is otherwise
# not reproducible), so a regenerated export only changes when the data does.
POINT_PARAMS: dict = {
    "objective": "huber",
    "alpha": 6.0,
    "seed": 2026,
    "deterministic": True,
    "force_row_wise": True,
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
