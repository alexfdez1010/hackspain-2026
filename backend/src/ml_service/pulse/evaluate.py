"""Does PULSE anticipate stress? Self-supervised check on each company's own future.

Stress month = overdraft (lowest daily cash below zero) or a returned direct debit
in the bank narratives. Label = at least two stress months in the next six.
Nothing here feeds the score; it only measures it.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import polars as pl
from sklearn.metrics import roc_auc_score

from ml_service.pulse.config import CASH_TYPES
from ml_service.pulse.variables import VARIABLES

HORIZON = 6
MIN_STRESS_MONTHS = 2
RETURNED_DEBIT_REGEX = (
    r"(?i)impagad|devoluci[oó]n recibo|devol\.? recibo|recibo devuelto|adeudo devuelto"
)


def stress_label(
    scored: pl.DataFrame, tx: pl.DataFrame, include_returned: bool = True
) -> pl.DataFrame:
    """Add ``stress_now`` and ``y_stress`` (+ ``has_future``) to the scored panel.

    ``include_returned=False`` labels stress on overdrafts only; use it to judge
    the returned-collections proxy of #8 without the label sharing its source.
    """
    returned = (
        tx.filter(
            pl.col("product_type").is_in(CASH_TYPES)
            & pl.col("description").str.contains(RETURNED_DEBIT_REGEX)
        )
        .group_by("company_id", pl.col("date").dt.truncate("1mo").alias("month"))
        .len()
        .rename({"len": "returned_n"})
    )
    df = scored.join(returned, on=["company_id", "month"], how="left").sort(
        "company_id", "month"
    )
    overdraft = (pl.col("cash_min") < 0).fill_null(False)
    returned_flag = (pl.col("returned_n") >= 1).fill_null(False)
    stress = (overdraft | returned_flag if include_returned else overdraft).cast(
        pl.Int32
    )
    df = df.with_columns(stress.alias("stress_now"))
    future = pl.sum_horizontal(
        [
            pl.col("stress_now").shift(-k).over("company_id")
            for k in range(1, HORIZON + 1)
        ]
    )
    has_future = pl.col("month").shift(-HORIZON).over("company_id").is_not_null()
    return df.with_columns(
        (future >= MIN_STRESS_MONTHS).cast(pl.Int32).alias("y_stress"),
        has_future.alias("has_future"),
    )


def _auc(y: np.ndarray, s: np.ndarray) -> float | None:
    m = ~np.isnan(s)
    if m.sum() < 100 or len(set(y[m])) < 2:
        return None
    return round(float(roc_auc_score(1 - y[m], s[m])), 4)


def _signed(df: pl.DataFrame, comp) -> np.ndarray:
    """Percentile of a component (already sign-aligned so higher is healthier)."""
    return df[f"{comp.name}__pct"].to_numpy().astype(float)


def _by_source(df: pl.DataFrame, y: np.ndarray) -> dict:
    """AUROC of PULSE split by how the cobro variables with proxies were backed."""
    out = {}
    src = df["var_ar90__source"].to_numpy().astype(object)
    for label, mask in (
        ("primary", src == "primary"),
        ("proxy", src == "proxy"),
        ("none", np.array([x is None for x in src])),
    ):
        out[label] = {
            "rows": int(mask.sum()),
            "auroc": _auc(y[mask], df["pulse"].to_numpy().astype(float)[mask]),
        }
    return out


def _overdraft_only(scored: pl.DataFrame, tx: pl.DataFrame) -> dict:
    """PULSE AUROC when stress is defined by overdrafts alone (no returned-debit narratives)."""
    df = stress_label(scored, tx, include_returned=False).filter(pl.col("has_future"))
    y = df["y_stress"].to_numpy()
    not_now = df["stress_now"].to_numpy() == 0
    return {
        "stress_rate": round(float(y.mean()), 4),
        "auroc_pulse": _auc(y, df["pulse"].to_numpy().astype(float)),
        "auroc_pulse_excluding_current_stress": _auc(
            y[not_now], df["pulse"].to_numpy().astype(float)[not_now]
        ),
        "auroc_returned_share": _auc(
            y, df["returned_share__pct"].to_numpy().astype(float)
        )
        if "returned_share__pct" in df.columns
        else None,
    }


def evaluate(scored: pl.DataFrame, tx: pl.DataFrame) -> dict:
    """AUROC of PULSE and of each variable for 'no stress in the next 6 months'."""
    df = stress_label(scored, tx).filter(pl.col("has_future"))
    y = df["y_stress"].to_numpy()
    out: dict = {
        "rows": len(df),
        "stress_rate": round(float(y.mean()), 4),
        "auroc_pulse": _auc(y, df["pulse"].to_numpy().astype(float)),
        "auroc_pulse_excluding_current_stress": _auc(
            y[df["stress_now"].to_numpy() == 0],
            df.filter(pl.col("stress_now") == 0)["pulse"].to_numpy().astype(float),
        ),
        "auroc_by_variable": {
            v.key: _auc(y, df[f"var_{v.key}"].to_numpy().astype(float))
            for v in VARIABLES
        },
        "auroc_by_proxy_component": {
            c.name: _auc(y, _signed(df, c))
            for v in VARIABLES
            for c in v.proxies
            if f"{c.name}__pct" in df.columns
        },
        "auroc_pulse_by_cobro_source": _by_source(df, y),
        "auroc_pulse_overdraft_only_label": _overdraft_only(scored, tx),
        "auroc_by_confidence": {},
        "auroc_by_months_observed": {},
        "auroc_temporal_from_2025_09": None,
    }
    conf = df["confidence"].to_numpy()
    for lo, hi in ((0.0, 0.4), (0.4, 0.7), (0.7, 1.01)):
        m = (conf >= lo) & (conf < hi)
        out["auroc_by_confidence"][f"{lo:.1f}-{min(hi, 1.0):.1f}"] = {
            "rows": int(m.sum()),
            "auroc": _auc(y[m], df["pulse"].to_numpy().astype(float)[m]),
        }
    mo = df["months_observed"].to_numpy()
    for lo, hi in ((1, 3), (4, 6), (7, 12), (13, 24)):
        m = (mo >= lo) & (mo <= hi)
        out["auroc_by_months_observed"][f"{lo}-{hi}"] = {
            "rows": int(m.sum()),
            "auroc": _auc(y[m], df["pulse"].to_numpy().astype(float)[m]),
        }
    late = df["month"].to_numpy() >= np.datetime64("2025-09-01")
    out["auroc_temporal_from_2025_09"] = _auc(
        y[late], df["pulse"].to_numpy().astype(float)[late]
    )
    return out


def run(work_dir: Path) -> dict:
    scored = pl.read_parquet(work_dir / "scored_panel.parquet")
    tx = pl.read_parquet(work_dir / "clean_transactions.parquet")
    result = evaluate(scored, tx)
    (work_dir / "evaluation.json").write_text(json.dumps(result, indent=1))
    return result
