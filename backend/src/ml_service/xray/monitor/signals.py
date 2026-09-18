"""Point-in-time statistical primitives used by the alert rules."""

from __future__ import annotations

import numpy as np

CUSUM_K = 1.5  # reference shift: half of the monthly drop we want to detect
CUSUM_H = 6.0  # decision interval: alarm when the accumulated drop exceeds it


def cusum_alarm(
    score: np.ndarray, k: float = CUSUM_K, h: float = CUSUM_H
) -> np.ndarray:
    """One-sided CUSUM alarm on month-over-month score *decreases*.

    ``S_t = max(0, S_{t-1} + (-delta_t) - k)`` raises the alarm as soon as
    ``S_t >= h``: several small losses add up, a single noisy month does not.

    Args:
        score: Monthly score series of one company, oldest first.
        k: Slack subtracted from every monthly loss.
        h: Alarm threshold on the accumulated loss.

    Returns:
        Boolean array, True where the CUSUM is in alarm state.
    """
    values = np.asarray(score, dtype=float)
    deltas = np.diff(values, prepend=values[:1])
    out = np.zeros(values.size, dtype=bool)
    level = 0.0
    for i, delta in enumerate(deltas):
        loss = 0.0 if np.isnan(delta) else -float(delta)
        level = max(0.0, level + loss - k)
        out[i] = level >= h
    return out


def persistent(mask: np.ndarray, months: int) -> np.ndarray:
    """True where ``mask`` has held for ``months`` consecutive months ending here."""
    out = np.asarray(mask, dtype=bool).copy()
    for lag in range(1, months):
        shifted = np.zeros_like(out)
        if lag < out.size:
            shifted[lag:] = np.asarray(mask, dtype=bool)[:-lag]
        out &= shifted
    return out


def lagged_diff(values: np.ndarray, lag: int) -> np.ndarray:
    """``values[i] - values[i - lag]``, NaN for the first ``lag`` positions."""
    arr = np.asarray(values, dtype=float)
    out = np.full(arr.size, np.nan)
    if lag < arr.size:
        out[lag:] = arr[lag:] - arr[:-lag]
    return out


def newly(labels: list[str], target: str) -> np.ndarray:
    """True on the first month of each run of ``target`` in ``labels``."""
    arr = np.array(labels, dtype=object) == target
    previous = np.zeros(arr.size, dtype=bool)
    previous[1:] = arr[:-1]
    return arr & ~previous


def crossing_up(values: np.ndarray, threshold: float) -> np.ndarray:
    """True where the series reaches ``threshold`` coming from below."""
    arr = np.asarray(values, dtype=float)
    above = arr >= threshold
    previous = np.zeros(arr.size, dtype=bool)
    previous[1:] = above[:-1]
    return above & ~previous


def with_cooldown(indices: np.ndarray, cooldown: int) -> list[int]:
    """Drop repeats of the same alert fired within ``cooldown`` months."""
    kept: list[int] = []
    for i in sorted(int(x) for x in indices):
        if not kept or i - kept[-1] > cooldown:
            kept.append(i)
    return kept
