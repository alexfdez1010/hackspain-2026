"""Currency normalisation: everything to EUR through a fixed FX table."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.clean.report import CleaningReport
from ml_service.pulse.fx import FX_PER_EUR


def fx_frame() -> pl.DataFrame:
    """FX table as a joinable frame (currency, fx_per_eur)."""
    return pl.DataFrame(
        {"currency": list(FX_PER_EUR), "fx_per_eur": list(FX_PER_EUR.values())}
    )


def product_currency(products: pl.DataFrame, companies: pl.DataFrame) -> pl.DataFrame:
    """Best-known currency per product: product's own, else its company's, else EUR."""
    return (
        products.select("product_id", "company_id", pcur=pl.col("currency"))
        .join(
            companies.select("company_id", ccur=pl.col("currency")),
            on="company_id",
            how="left",
        )
        .select(
            "product_id",
            currency=pl.coalesce(pl.col("pcur"), pl.col("ccur"), pl.lit("EUR")),
        )
    )


def convert(
    df: pl.DataFrame,
    currency_col: str,
    amount_cols: tuple[str, ...],
    table: str,
    report: CleaningReport,
) -> pl.DataFrame:
    """Add ``<col>_eur`` for each amount column; unknown currency is treated as EUR and logged."""
    out = df.join(
        fx_frame().rename({"currency": currency_col}), on=currency_col, how="left"
    )
    unknown = out["fx_per_eur"].is_null().sum()
    report.add(table, "currency not in FX table (assumed EUR)", unknown, len(out))
    non_eur = (out[currency_col].fill_null("EUR") != "EUR").sum()
    report.add(table, "rows converted from a non-EUR currency", non_eur, len(out))
    fx = pl.col("fx_per_eur").fill_null(1.0)
    return out.with_columns(
        [(pl.col(c) / fx).alias(f"{c}_eur") for c in amount_cols]
    ).drop("fx_per_eur")
