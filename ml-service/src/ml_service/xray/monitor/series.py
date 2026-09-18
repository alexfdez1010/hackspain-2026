"""Per-company view of the scored panel used by the alert rules."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

import numpy as np
import polars as pl

NUMERIC_COLUMNS: tuple[str, ...] = (
    "score",
    "p_stress",
    "regime_shift",
    "cash_runway_months",
    "returned_debit_n",
    "payables_overdue_share",
)


@dataclass(frozen=True)
class CompanySeries:
    """Monthly arrays for one company, oldest month first."""

    company_id: str
    months: list[datetime]
    regime: list[str]
    changepoint_month: list[datetime | None]
    values: dict[str, np.ndarray]

    def __len__(self) -> int:
        """Number of observed months."""
        return len(self.months)

    def col(self, name: str) -> np.ndarray:
        """Numeric column as a float array (all-NaN when the column is absent)."""
        return self.values.get(name, np.full(len(self.months), np.nan))

    @property
    def score(self) -> np.ndarray:
        """Smoothed 0-100 score."""
        return self.col("score")


def _floats(frame: pl.DataFrame, name: str) -> np.ndarray:
    return frame[name].cast(pl.Float64).fill_null(np.nan).to_numpy()


def build_series(frame: pl.DataFrame) -> list[CompanySeries]:
    """Split a scored panel into one :class:`CompanySeries` per company."""
    ordered = frame.sort("company_id", "month")
    present = [c for c in NUMERIC_COLUMNS if c in ordered.columns]
    out: list[CompanySeries] = []
    for key, group in ordered.group_by("company_id", maintain_order=True):
        company_id = key[0] if isinstance(key, tuple) else key
        regime = (
            group["regime"].to_list()
            if "regime" in group.columns
            else [""] * group.height
        )
        cps: list[Any] = (
            group["changepoint_month"].to_list()
            if "changepoint_month" in group.columns
            else [None] * group.height
        )
        out.append(
            CompanySeries(
                company_id=str(company_id),
                months=group["month"].to_list(),
                regime=[r or "steady" for r in regime],
                changepoint_month=cps,
                values={c: _floats(group, c) for c in present},
            )
        )
    return out
