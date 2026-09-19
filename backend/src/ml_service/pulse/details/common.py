"""Shared pieces of the per-variable detail export: context, windows and row packing.

Every builder in this package works on the whole population at once and returns
``{company_id: ...}`` lookups, so the writer never touches the heavy frames again.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

import polars as pl

from ml_service.pulse.clean.pipeline import CleanData
from ml_service.pulse.features.months import month_index

MAX_ROWS = 8
"""Longest ranking published for one variable."""
MONTHS_SHOWN = 12
"""Months of history published next to every ranking."""
DAYS_SHOWN = 62
"""Length of the daily cash series (two months up to the reference month end)."""

Rows = dict[str, list[dict]]
"""Per company, the rows of one table."""
Values = dict[str, float | None]
"""Per company, a single figure."""
Blocks = dict[str, dict]
"""Per company, the detail block of one variable."""


@dataclass(frozen=True)
class DetailContext:
    """Everything the per-variable builders read, prepared once for all companies.

    Attributes:
        clean: Cleaned inputs (transactions, invoices, anchors, debt products).
        products: ``product_id, label, type, bank`` for every bank and debt product.
        schedule: ``debt_schedule_config`` rows, joined to the debt products.
        scored: The scored panel restricted to the exported companies.
        ref: ``company_id, ref_month, ref_mi, ref_day`` (see :func:`reference_months`).
        companies: The company ids to export, in output order.
    """

    clean: CleanData
    products: pl.DataFrame
    schedule: pl.DataFrame
    scored: pl.DataFrame
    ref: pl.DataFrame
    companies: tuple[str, ...]


def reference_months(scored: pl.DataFrame) -> pl.DataFrame:
    """Last observed month per company, as a month, a month index and a month-end day."""
    ref = scored.group_by("company_id").agg(pl.col("month").max().alias("ref_month"))
    return ref.with_columns(
        month_index("ref_month").alias("ref_mi"),
        pl.col("ref_month")
        .dt.offset_by("1mo")
        .dt.offset_by("-1d")
        .dt.date()
        .alias("ref_day"),
    )


def product_labels(banking: pl.DataFrame, debt: pl.DataFrame) -> pl.DataFrame:
    """One row per product with the label, type and bank the web app displays."""
    cols = ["product_id", "label", "type", pl.col("bank_name").alias("bank")]
    return pl.concat([banking.select(cols), debt.select(cols)])


def make_context(
    clean: CleanData,
    banking_products: pl.DataFrame,
    schedule: pl.DataFrame,
    scored: pl.DataFrame,
    companies: Sequence[str] | None = None,
) -> DetailContext:
    """Prepare the context from the cleaned frames and the scored panel."""
    ids = (
        tuple(companies)
        if companies is not None
        else tuple(sorted(scored["company_id"].unique().to_list()))
    )
    scored = scored.filter(pl.col("company_id").is_in(ids))
    return DetailContext(
        clean=clean,
        products=product_labels(banking_products, clean.debt_products),
        schedule=schedule,
        scored=scored,
        ref=reference_months(scored),
        companies=ids,
    )


def rounded(df: pl.DataFrame) -> pl.DataFrame:
    """Round every float column to two decimals and turn NaN into null."""
    return df.with_columns(pl.col(pl.Float64).fill_nan(None).round(2))


def rows_by_company(
    df: pl.DataFrame, fields: Sequence[str], limit: int | None = MAX_ROWS
) -> Rows:
    """Pack an already sorted frame into ``{company_id: [row, ...]}``, capped at ``limit``."""
    if df.is_empty():
        return {}
    struct = pl.struct(list(fields))
    agg = struct if limit is None else struct.head(limit)
    packed = df.group_by("company_id", maintain_order=True).agg(agg.alias("rows"))
    return {r["company_id"]: r["rows"] for r in packed.to_dicts()}


def values_by_company(df: pl.DataFrame, field: str) -> Values:
    """Pack one column of a one-row-per-company frame into ``{company_id: value}``."""
    if df.is_empty():
        return {}
    return {
        r["company_id"]: r[field] for r in df.select("company_id", field).to_dicts()
    }


def at_reference(panel: pl.DataFrame, ref: pl.DataFrame) -> pl.DataFrame:
    """Rows of a ``(company_id, month)`` frame at each company's reference month."""
    return panel.join(ref, on="company_id").filter(
        pl.col("month") == pl.col("ref_month")
    )


def month_rows(panel: pl.DataFrame, columns: dict[str, str]) -> Rows:
    """Last :data:`MONTHS_SHOWN` observed months per company, ascending.

    Args:
        panel: A ``(company_id, month, ...)`` frame, one row per observed month.
        columns: Output key -> column of ``panel``; ``month`` is always the first key.
    """
    df = (
        panel.sort("company_id", "month")
        .group_by("company_id", maintain_order=True)
        .tail(MONTHS_SHOWN)
        .select(
            "company_id",
            pl.col("month").dt.strftime("%Y-%m"),
            *[pl.col(src).alias(dst) for dst, src in columns.items()],
        )
    )
    return rows_by_company(rounded(df), ["month", *columns], limit=None)


def in_window(
    inv: pl.DataFrame, ref: pl.DataFrame, date_col: str, months: int, offset: int = 0
) -> pl.DataFrame:
    """Invoices whose ``date_col`` falls in the trailing window of the reference month.

    The window spans ``months`` months and ends ``offset`` months before the
    company's reference month, which is how every PULSE window is defined.
    """
    hi = pl.col("ref_mi") - offset
    lo = hi - months + 1
    mi = month_index(date_col)
    return (
        inv.join(ref, on="company_id")
        .filter((mi >= lo) & (mi <= hi))
        .drop("ref_month", "ref_mi", "ref_day")
    )
