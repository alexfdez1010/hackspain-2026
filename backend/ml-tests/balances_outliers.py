"""Data loading and outlier detection helpers for balances.csv."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

DATA_PATH = (
    Path(__file__).resolve().parent.parent / "data" / "raw" / "xray" / "balances.csv"
)
NUMERIC_COLS = ["balance", "available", "granted", "liquidity", "countable"]


def load_balances(path: Path = DATA_PATH) -> pd.DataFrame:
    """Load balances.csv with parsed dates and coerced numeric columns.

    Args:
        path: Location of the raw balances CSV.

    Returns:
        DataFrame with an extra ``product_type`` column: "credit_line" when
        ``granted`` is set (a credit limit exists), "cash" otherwise. This is
        a heuristic split, not the ground-truth product taxonomy.
    """
    df = pd.read_csv(path, parse_dates=["date"])
    for col in NUMERIC_COLS:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df["product_type"] = np.where(df["granted"].notna(), "credit_line", "cash")
    return df


def iqr_bounds(series: pd.Series, k: float = 1.5) -> tuple[float, float]:
    """Compute Tukey IQR fences ``[Q1 - k*IQR, Q3 + k*IQR]`` for a series."""
    q1, q3 = series.quantile([0.25, 0.75])
    iqr = q3 - q1
    return q1 - k * iqr, q3 + k * iqr


def flag_outliers(
    df: pd.DataFrame, column: str, group_col: str | None = None
) -> pd.Series:
    """Flag IQR outliers in ``column``, optionally fencing per ``group_col``.

    Args:
        df: Source frame.
        column: Numeric column to test.
        group_col: If set, IQR fences are computed separately per group
            (useful when the column mixes populations with different scales,
            e.g. cash accounts vs. credit lines).

    Returns:
        Boolean mask aligned with ``df.index``.
    """
    mask = pd.Series(False, index=df.index)
    groups = df.groupby(group_col) if group_col else [(None, df)]
    for _, group in groups:
        s = group[column].dropna()
        if s.empty:
            continue
        low, high = iqr_bounds(s)
        mask.loc[s.index] = (s < low) | (s > high)
    return mask


def column_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Build a per-column descriptive + IQR outlier summary table."""
    rows = []
    for col in NUMERIC_COLS:
        s = df[col].dropna()
        missing = df[col].isna().sum()
        row = {
            "column": col,
            "n_present": len(s),
            "pct_missing": 100 * missing / len(df),
        }
        if s.empty:
            rows.append(
                row
                | {
                    k: np.nan
                    for k in (
                        "mean",
                        "std",
                        "min",
                        "max",
                        "iqr_low",
                        "iqr_high",
                        "n_outliers",
                        "pct_outliers",
                    )
                }
            )
            continue
        low, high = iqr_bounds(s)
        outliers = s[(s < low) | (s > high)]
        row.update(
            mean=s.mean(),
            std=s.std(),
            min=s.min(),
            max=s.max(),
            iqr_low=low,
            iqr_high=high,
            n_outliers=len(outliers),
            pct_outliers=100 * len(outliers) / len(s),
        )
        rows.append(row)
    return pd.DataFrame(rows)
