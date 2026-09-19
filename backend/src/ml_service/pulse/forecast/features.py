"""Assemble the forecast feature frame: scored panel + flows + calendar + dynamics + targets."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.clean.pipeline import CleanData
from ml_service.pulse.forecast.config import HORIZONS
from ml_service.pulse.forecast.features_calendar import (
    calendar_columns,
    calendar_features,
    calendar_ratios,
)
from ml_service.pulse.forecast.features_flows import (
    FLOW_COLUMNS,
    flow_dynamics,
    monthly_flows,
)
from ml_service.pulse.variables import PILLARS, VARIABLES

KEY = ["company_id", "month"]
TARGET_PREFIX = "y_"
EXCLUDED_PREFIXES = (TARGET_PREFIX, "contrib_", "top_client_id", "group_id")
NUMERIC = (pl.Float64, pl.Float32, pl.Int64, pl.Int32, pl.UInt32, pl.Int8, pl.Boolean)
DYNAMIC_LEVELS = [
    c.name
    for v in VARIABLES
    for c in v.components
    if not c.name.endswith(("_d3", "_d6"))
]
DYNAMIC_LEVELS += [f"pillar_{p}" for p in PILLARS] + ["pulse"]


def _dynamics(df: pl.DataFrame) -> pl.DataFrame:
    exprs = []
    for c in DYNAMIC_LEVELS:
        for lag in (1, 3, 6):
            exprs.append(
                (pl.col(c) - pl.col(c).shift(lag).over("company_id")).alias(
                    f"{c}_d{lag}"
                )
            )
        exprs.append(
            pl.col(c)
            .rolling_std(6, min_samples=3)
            .over("company_id")
            .alias(f"{c}_vol6")
        )
    return df.with_columns(exprs)


def _group_context(df: pl.DataFrame) -> pl.DataFrame:
    grp = df.group_by(["group_id", "month"]).agg(
        pl.col("pulse").mean().alias("group_pulse"), pl.len().alias("group_n")
    )
    return df.join(grp, on=["group_id", "month"], how="left")


def add_targets(df: pl.DataFrame) -> pl.DataFrame:
    """``y_<h>`` = change of ``pulse`` between month t and t+h (null when unobservable)."""
    return df.with_columns(
        [
            (pl.col("pulse").shift(-h).over("company_id") - pl.col("pulse")).alias(
                f"{TARGET_PREFIX}{h}"
            )
            for h in HORIZONS
        ]
    )


def forecast_frame(scored: pl.DataFrame, clean: CleanData) -> pl.DataFrame:
    """One row per company-month with every forecast feature and the targets."""
    df = (
        scored.join(monthly_flows(clean.transactions), on=KEY, how="left")
        .join(calendar_features(clean.invoices), on=KEY, how="left")
        .sort(KEY)
    )
    zero_fill = [c for c in FLOW_COLUMNS + tuple(calendar_columns()) if c in df.columns]
    missing = [
        c for c in FLOW_COLUMNS + tuple(calendar_columns()) if c not in df.columns
    ]
    df = df.with_columns(
        [pl.col(c).fill_null(0.0) for c in zero_fill]
        + [pl.lit(0.0).alias(c) for c in missing]
    )
    df = flow_dynamics(df)
    df = calendar_ratios(df)
    df = _dynamics(df)
    df = _group_context(df)
    return add_targets(df)


def feature_columns(df: pl.DataFrame) -> list[str]:
    """Deterministic list of model inputs: every numeric column that is not a key, target or output."""
    return [
        c
        for c in df.columns
        if c not in KEY
        and not c.startswith(EXCLUDED_PREFIXES)
        and df[c].dtype in NUMERIC
    ]


def to_matrix(df: pl.DataFrame, features: list[str]):
    """Float matrix in the model's column order; columns absent from ``df`` become NaN."""
    exprs = [
        (
            pl.col(c).cast(pl.Float64)
            if c in df.columns
            else pl.lit(None, dtype=pl.Float64)
        ).alias(c)
        for c in features
    ]
    return df.select(exprs).to_numpy()
