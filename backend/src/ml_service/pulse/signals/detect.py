"""Find the months where PULSE really moves and label, ex post, what followed.

A signal opens when the score sits ``MIN_MOVE`` points away from its own
three-month baseline and at least ``MIN_BREADTH`` pillars moved the same way.
Only the first month of a run counts, so a steady slide is one episode. When
three more months are observed the episode is labelled persistent (the score
did not return to its baseline) or transitory. Everything reads the scored
panel; nothing here changes the score.
"""

from __future__ import annotations

import numpy as np
import polars as pl

from ml_service.pulse.signals.config import (
    BASELINE_MONTHS,
    FOLLOW_UP_MONTHS,
    MIN_BREADTH,
    MIN_MOVE,
    PILLAR_MOVE,
    RECOVERY_TOLERANCE,
)
from ml_service.pulse.variables import PILLARS

PILLAR_COLUMNS = [f"pillar_{p}" for p in PILLARS]
SIGNAL_COLUMNS = [
    "company_id",
    "month",
    "direction",
    "level",
    "baseline",
    "move",
    "breadth",
    "confidence",
    "volatility",
    *(f"delta_{p}" for p in PILLARS),
    "persistent",
]


def _pillar_deltas(pillars: np.ndarray, t: int) -> np.ndarray:
    window = pillars[t - BASELINE_MONTHS : t]
    known = np.isfinite(window).sum(axis=0)
    base = np.where(known > 0, np.nansum(window, axis=0) / np.maximum(known, 1), np.nan)
    return pillars[t] - base


def _outcome(pulse: np.ndarray, t: int, baseline: float, direction: int) -> bool | None:
    """Persistent when the score stayed away from its baseline for the follow-up months."""
    end = t + FOLLOW_UP_MONTHS
    if end >= len(pulse):
        return None
    follow = pulse[t + 1 : end + 1]
    if direction < 0:
        return not bool(np.nanmax(follow) >= baseline - RECOVERY_TOLERANCE)
    return not bool(np.nanmin(follow) <= baseline + RECOVERY_TOLERANCE)


def detect_company(history: pl.DataFrame) -> list[dict]:
    """Signals of one company from its observed months, ascending."""
    rows = history.sort("month")
    pulse = rows["pulse"].to_numpy().astype(float)
    conf = rows["confidence"].to_numpy().astype(float)
    pillars = rows.select(PILLAR_COLUMNS).to_numpy().astype(float)
    months = rows["month"].to_list()
    signals: list[dict] = []
    previous = 0
    for t in range(BASELINE_MONTHS, len(pulse)):
        window = pulse[t - BASELINE_MONTHS : t]
        if not np.isfinite(window).all() or not np.isfinite(pulse[t]):
            previous = 0
            continue
        baseline = float(window.mean())
        move = float(pulse[t] - baseline)
        deltas = _pillar_deltas(pillars, t)
        direction = 1 if move >= MIN_MOVE else -1 if move <= -MIN_MOVE else 0
        breadth = int(np.nansum(deltas * direction > PILLAR_MOVE)) if direction else 0
        fires = direction != 0 and breadth >= MIN_BREADTH
        if fires and direction != previous:
            diffs = np.diff(pulse[: t + 1])
            signals.append(
                {
                    "company_id": rows["company_id"][0],
                    "month": months[t],
                    "direction": direction,
                    "level": float(pulse[t]),
                    "baseline": baseline,
                    "move": move,
                    "breadth": breadth,
                    "confidence": float(conf[t]) if np.isfinite(conf[t]) else 0.0,
                    "volatility": float(np.nanstd(diffs)) if len(diffs) > 1 else 0.0,
                    **{
                        f"delta_{p}": (float(d) if np.isfinite(d) else 0.0)
                        for p, d in zip(PILLARS, deltas)
                    },
                    "persistent": _outcome(pulse, t, baseline, direction),
                }
            )
        previous = direction if fires else 0
    return signals


def detect_all(scored: pl.DataFrame) -> pl.DataFrame:
    """Every signal of every company in the scored panel, one row each."""
    rows: list[dict] = []
    for _, hist in scored.group_by("company_id", maintain_order=True):
        rows.extend(detect_company(hist))
    schema = {
        "company_id": pl.Utf8,
        "month": pl.Datetime("us"),
        "direction": pl.Int32,
        "level": pl.Float64,
        "baseline": pl.Float64,
        "move": pl.Float64,
        "breadth": pl.Int32,
        "confidence": pl.Float64,
        "volatility": pl.Float64,
        **{f"delta_{p}": pl.Float64 for p in PILLARS},
        "persistent": pl.Boolean,
    }
    return pl.DataFrame(rows, schema=schema).select(SIGNAL_COLUMNS)
