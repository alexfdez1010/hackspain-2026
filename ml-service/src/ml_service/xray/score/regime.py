"""Regime detection: separate a transient dip from a structural change (PELT)."""

from __future__ import annotations

import numpy as np
import polars as pl
import ruptures as rpt

PEN = 250.0  # penalty for PELT on 0-100 scores; higher = fewer changepoints
MIN_SIZE = 2
SHIFT_POINTS = 8.0  # minimum level shift to call a change structural
LOOKBACK = 3  # months used to decide whether a dip has reverted


def _changepoints(series: np.ndarray) -> list[int]:
    if len(series) < 2 * MIN_SIZE + 1:
        return []
    algo = rpt.Pelt(model="l2", min_size=MIN_SIZE, jump=1).fit(series.reshape(-1, 1))
    return [b for b in algo.predict(pen=PEN) if b < len(series)]


def _label_row(
    scores: np.ndarray, i: int, cps: list[int]
) -> tuple[str, float, int | None]:
    """Regime label at position i using only scores[: i + 1] (point-in-time)."""
    past = [c for c in cps if c <= i]
    last_cp = past[-1] if past else None
    shift = 0.0
    if last_cp is not None and last_cp >= 1:
        before = scores[max(0, last_cp - 6) : last_cp].mean()
        after = scores[last_cp : i + 1].mean()
        shift = float(after - before)
    persisted = last_cp is not None and (i - last_cp + 1) >= MIN_SIZE
    if persisted and shift <= -SHIFT_POINTS:
        return "structural_decline", shift, last_cp
    if persisted and shift >= SHIFT_POINTS:
        return "structural_improvement", shift, last_cp
    if i >= LOOKBACK:
        ref = scores[i - LOOKBACK]
        window = scores[i - LOOKBACK + 1 : i + 1]
        if (
            window.min() <= ref - SHIFT_POINTS
            and abs(scores[i] - ref) < SHIFT_POINTS / 2
        ):
            return "transient_dip", float(window.min() - ref), last_cp
        if (
            window.max() >= ref + SHIFT_POINTS
            and abs(scores[i] - ref) < SHIFT_POINTS / 2
        ):
            return "transient_spike", float(window.max() - ref), last_cp
    return "steady", shift, last_cp


def add_regimes(panel: pl.DataFrame, col: str = "score") -> pl.DataFrame:
    """Add ``regime``, ``regime_shift`` and ``changepoint_month`` per company-month.

    Changepoints are re-estimated with the data available up to each month so
    that the label at month m never uses later observations.
    """
    panel = panel.sort("company_id", "month")
    labels: list[str] = []
    shifts: list[float] = []
    cp_months: list[object] = []
    for _, g in panel.group_by("company_id", maintain_order=True):
        s = g[col].to_numpy().astype(float)
        months = g["month"].to_list()
        for i in range(len(s)):
            cps = _changepoints(s[: i + 1])
            label, shift, cp = _label_row(s, i, cps)
            labels.append(label)
            shifts.append(shift)
            cp_months.append(months[cp] if cp is not None else None)
    return panel.with_columns(
        pl.Series("regime", labels),
        pl.Series("regime_shift", shifts),
        pl.Series("changepoint_month", cp_months, dtype=pl.Datetime("us")),
    )
