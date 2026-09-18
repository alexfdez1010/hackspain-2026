"""Shared fixtures for the X-Ray unit tests.

The engine only ever reaches raw data through :class:`Dataset`, which reads
Parquet files from its cache folder. Tests therefore build a dataset by writing
tiny in-memory frames straight into a temporary cache, without any CSV.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

import polars as pl
import pytest

from ml_service.xray.io import Dataset

M = [datetime(2024, 9, 1), datetime(2024, 10, 1), datetime(2024, 11, 1)]


@pytest.fixture
def make_dataset(tmp_path: Path):
    """Return a factory building a :class:`Dataset` from named DataFrames."""

    def _make(**tables: pl.DataFrame) -> Dataset:
        cache = tmp_path / "cache"
        cache.mkdir(parents=True, exist_ok=True)
        for name, frame in tables.items():
            frame.write_parquet(cache / f"{name}.parquet")
        return Dataset(raw_dir=tmp_path / "raw", cache_dir=cache)

    return _make


def tx_frame(rows: list[dict]) -> pl.DataFrame:
    """Build a transactions frame with the columns the feature code expects."""
    defaults = {
        "transaction_id": "T",
        "company_id": "C1",
        "product_id": "P1",
        "date": M[0],
        "amount": 0.0,
        "status": "booked",
        "category": None,
        "description": "",
        "counterparty_id": None,
    }
    return pl.DataFrame([{**defaults, **r} for r in rows])


def invoice_frame(rows: list[dict]) -> pl.DataFrame:
    """Build an invoices frame with the columns the feature code expects."""
    defaults = {
        "operation_id": "I",
        "company_id": "C1",
        "issuance_date": M[0],
        "due_date": M[0],
        "payment_date": None,
        "amount": 100.0,
        "exchange_rate": 1.0,
        "status": "pending",
        "pending_amount": 0.0,
        "counterparty_id": "X1",
    }
    # A row given a payment date is settled unless the test says otherwise.
    rows = [
        {**r, "status": r.get("status", "paid" if r.get("payment_date") else "pending")}
        for r in rows
    ]
    return pl.DataFrame(
        [{**defaults, **r} for r in rows],
        schema_overrides={
            "payment_date": pl.Datetime("us"),
            "due_date": pl.Datetime("us"),
        },
    )


def monthly_panel(company: str, months: list[datetime], **columns) -> pl.DataFrame:
    """Build a company-month frame with constant or per-month column values."""
    data = {"company_id": [company] * len(months), "month": months}
    for name, value in columns.items():
        data[name] = value if isinstance(value, list) else [value] * len(months)
    return pl.DataFrame(data)
