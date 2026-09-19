"""Read the raw CSV folder into typed Polars frames (with a Parquet cache)."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import polars as pl

TABLES = (
    "groups",
    "companies",
    "banking_products",
    "debt_products",
    "debt_schedule_config",
    "balances",
    "invoices",
    "transactions",
)
DATE_COLUMNS = {
    "transactions": ("date", "value_date"),
    "invoices": ("issuance_date", "due_date", "payment_date"),
    "balances": ("date",),
    "debt_schedule_config": ("next_payment_date", "last_payment_date"),
}
FLOAT_COLUMNS = {
    "balances": ("balance", "available", "granted", "liquidity", "countable"),
    "debt_products": ("granted", "outstanding", "liquidity"),
    "invoices": ("amount", "pending_amount", "exchange_rate"),
    "transactions": ("amount", "exchange_rate"),
}


@dataclass(frozen=True)
class RawData:
    """The eight raw tables, typed but not cleaned."""

    groups: pl.DataFrame
    companies: pl.DataFrame
    banking_products: pl.DataFrame
    debt_products: pl.DataFrame
    debt_schedule_config: pl.DataFrame
    balances: pl.DataFrame
    invoices: pl.DataFrame
    transactions: pl.DataFrame

    @property
    def products(self) -> pl.DataFrame:
        """Bank + debt products with a unified (product_id, company_id, type, currency)."""
        cols = ["product_id", "company_id", "type", "currency"]
        return pl.concat(
            [self.banking_products.select(cols), self.debt_products.select(cols)]
        )


def _read_table(raw_dir: Path, name: str) -> pl.DataFrame:
    """Read one CSV, parsing dates and numeric columns leniently (corrupt -> null)."""
    df = pl.read_csv(raw_dir / f"{name}.csv", infer_schema_length=0)
    exprs = []
    for col in DATE_COLUMNS.get(name, ()):
        exprs.append(pl.col(col).str.to_datetime("%Y-%m-%d %H:%M:%S", strict=False))
    for col in FLOAT_COLUMNS.get(name, ()):
        exprs.append(pl.col(col).cast(pl.Float64, strict=False))
    if name == "debt_schedule_config":
        exprs += [
            pl.col(c).cast(pl.Float64, strict=False)
            for c in (
                "granted_balance",
                "outstanding_balance",
                "annual_interest_rate_or_spread",
            )
        ]
        exprs.append(pl.col("total_periods").cast(pl.Int64, strict=False))
    if name == "groups":
        exprs.append(pl.col("n_companies_in_sample").cast(pl.Int64, strict=False))
    return df.with_columns(exprs) if exprs else df


def load_raw(raw_dir: Path, cache_dir: Path | None = None) -> RawData:
    """Load every table, caching each as Parquet under ``cache_dir`` when given."""
    frames: dict[str, pl.DataFrame] = {}
    for name in TABLES:
        cached = cache_dir / f"{name}.parquet" if cache_dir else None
        if cached and cached.exists():
            frames[name] = pl.read_parquet(cached)
            continue
        frames[name] = _read_table(raw_dir, name)
        if cached:
            cached.parent.mkdir(parents=True, exist_ok=True)
            frames[name].write_parquet(cached)
    return RawData(**frames)
