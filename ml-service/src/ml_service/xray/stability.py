"""Stability diagnostics of the scored panel: PSI, churn and direction flips."""

from __future__ import annotations

from itertools import pairwise

import numpy as np
import polars as pl

N_PSI_BINS = 10
FLIP_WINDOW = 12
MAX_FLIPS = 3
EPS = 1e-6


def psi(expected: np.ndarray, actual: np.ndarray, edges: np.ndarray) -> float:
    """Population stability index of ``actual`` versus ``expected`` on fixed bins."""
    exp_h = np.histogram(expected, bins=edges)[0] / max(len(expected), 1)
    act_h = np.histogram(actual, bins=edges)[0] / max(len(actual), 1)
    exp_h = np.clip(exp_h, EPS, None)
    act_h = np.clip(act_h, EPS, None)
    return float(((act_h - exp_h) * np.log(act_h / exp_h)).sum())


def monthly_psi(scored: pl.DataFrame, col: str = "score") -> list[dict]:
    """PSI of the score distribution of each month against the previous month.

    Bin edges are the deciles of the pooled distribution so every month is
    compared on the same grid.
    """
    values = scored[col].drop_nulls().drop_nans().to_numpy()
    if values.size == 0:
        return []
    edges = np.unique(np.quantile(values, np.linspace(0, 1, N_PSI_BINS + 1)))
    edges[0], edges[-1] = -np.inf, np.inf
    months = scored.select("month").unique().sort("month")["month"].to_list()
    out = []
    for prev, cur in pairwise(months):
        a = scored.filter(pl.col("month") == prev)[col].drop_nulls().to_numpy()
        b = scored.filter(pl.col("month") == cur)[col].drop_nulls().to_numpy()
        out.append({"month": str(cur)[:7], "psi": round(psi(a, b, edges), 5)})
    return out


def score_churn(scored: pl.DataFrame, col: str = "score") -> dict:
    """Average and tail of the absolute month-over-month score movement."""
    delta = (
        scored.sort("company_id", "month")
        .with_columns(
            (pl.col(col) - pl.col(col).shift(1).over("company_id")).abs().alias("d")
        )["d"]
        .drop_nulls()
        .to_numpy()
    )
    if delta.size == 0:
        return {"mean_abs_delta": float("nan"), "p95_abs_delta": float("nan")}
    return {
        "mean_abs_delta": round(float(np.nanmean(delta)), 3),
        "p95_abs_delta": round(float(np.nanpercentile(delta, 95)), 3),
        "max_abs_delta": round(float(np.nanmax(delta)), 3),
    }


def direction_flips(scored: pl.DataFrame, window: int = FLIP_WINDOW) -> dict:
    """Share of companies whose direction label flips more than ``MAX_FLIPS`` times.

    Only the last ``window`` months of each company are considered, which is the
    horizon a portfolio manager actually looks at.
    """
    tail = (
        scored.sort("company_id", "month")
        .group_by("company_id", maintain_order=True)
        .tail(window)
        .with_columns(
            (pl.col("direction") != pl.col("direction").shift(1).over("company_id"))
            .fill_null(False)
            .alias("flip")
        )
    )
    per_company = tail.group_by("company_id").agg(pl.col("flip").sum().alias("flips"))
    flips = per_company["flips"].to_numpy()
    if flips.size == 0:
        return {"n_companies": 0}
    return {
        "n_companies": int(flips.size),
        "mean_flips": round(float(flips.mean()), 3),
        "share_over_3_flips": round(float((flips > MAX_FLIPS).mean()), 4),
    }


def stability_report(scored: pl.DataFrame, col: str = "score") -> dict:
    """Bundle PSI, churn and flip diagnostics for the scored panel."""
    series = monthly_psi(scored, col)
    values = [r["psi"] for r in series]
    return {
        "psi_monthly": series,
        "psi_mean": round(float(np.mean(values)), 5) if values else float("nan"),
        "psi_max": round(float(np.max(values)), 5) if values else float("nan"),
        **score_churn(scored, col),
        "direction_flips": direction_flips(scored),
    }
