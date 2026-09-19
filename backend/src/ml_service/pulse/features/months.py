"""Shared helpers: month grid, month index arithmetic, rolling sums and deltas."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.config import FIRST_MONTH, LAST_FULL_MONTH


def month_index(col: str | pl.Expr = "month") -> pl.Expr:
    """Months since FIRST_MONTH (0-based) for a datetime column or expression."""
    e = pl.col(col) if isinstance(col, str) else col
    return (
        (e.dt.year() - FIRST_MONTH.year) * 12 + e.dt.month() - FIRST_MONTH.month
    ).cast(pl.Int32)


def month_from_index(col: str | pl.Expr) -> pl.Expr:
    """Inverse of :func:`month_index`: first day of the month as a datetime."""
    e = pl.col(col) if isinstance(col, str) else col
    return pl.lit(FIRST_MONTH).dt.offset_by(pl.format("{}mo", e))


LAST_INDEX = (
    (LAST_FULL_MONTH.year - FIRST_MONTH.year) * 12
    + LAST_FULL_MONTH.month
    - FIRST_MONTH.month
)


def month_grid(first_active: pl.DataFrame) -> pl.DataFrame:
    """Dense (company_id, month) grid from each company's first active month to LAST_FULL_MONTH."""
    months = pl.datetime_range(FIRST_MONTH, LAST_FULL_MONTH, "1mo", eager=True).alias(
        "month"
    )
    grid = first_active.select("company_id", "first_month").join(
        pl.DataFrame({"month": months}), how="cross"
    )
    return (
        grid.filter(pl.col("month") >= pl.col("first_month"))
        .drop("first_month")
        .sort("company_id", "month")
    )


def rolling_sum(col: str, window: int, by: str = "company_id") -> pl.Expr:
    """Trailing sum over ``window`` rows of a dense monthly series (nulls count as 0)."""
    return pl.col(col).fill_null(0.0).rolling_sum(window, min_samples=1).over(by)


def delta(col: str, lag: int, by: str = "company_id") -> pl.Expr:
    """Change versus ``lag`` months earlier on a dense monthly series."""
    return pl.col(col) - pl.col(col).shift(lag).over(by)


def weighted_mean(value: str, weight: str) -> pl.Expr:
    """Value-weighted mean, null when the weights sum to zero."""
    w = pl.col(weight)
    return (
        pl.when(w.sum() > 0).then((pl.col(value) * w).sum() / w.sum()).otherwise(None)
    )


def rolling_weighted_mean(
    num: str, den: str, window: int, by: str = "company_id"
) -> pl.Expr:
    """Trailing value-weighted mean from monthly numerator/denominator columns."""
    n = rolling_sum(num, window, by)
    d = rolling_sum(den, window, by)
    return pl.when(d > 0).then(n / d).otherwise(None)
