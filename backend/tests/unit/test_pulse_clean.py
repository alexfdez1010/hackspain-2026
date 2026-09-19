"""Unit tests for the PULSE cleaning rules on tiny synthetic frames."""

from datetime import datetime

import polars as pl

from ml_service.pulse.clean.currency import convert, product_currency
from ml_service.pulse.clean.invoices import _validate_dates
from ml_service.pulse.clean.report import CleaningReport
from ml_service.pulse.clean.transactions import _drop_duplicates, _drop_outliers
from ml_service.pulse.config import CLEAN


def test_product_currency_falls_back_to_company_then_eur():
    products = pl.DataFrame(
        {
            "product_id": ["P1", "P2", "P3"],
            "company_id": ["C1", "C2", "C3"],
            "type": ["checking"] * 3,
            "currency": ["USD", None, None],
        }
    )
    companies = pl.DataFrame(
        {"company_id": ["C1", "C2", "C3"], "currency": ["EUR", "GBP", None]}
    )
    out = product_currency(products, companies).sort("product_id")
    assert out["currency"].to_list() == ["USD", "GBP", "EUR"]


def test_convert_uses_fixed_table_and_ignores_exchange_rate_column():
    df = pl.DataFrame(
        {
            "currency": ["EUR", "USD", "XXX"],
            "amount": [100.0, 113.0, 5.0],
            "exchange_rate": [1.0, 6500.0, 0.0],
        }
    )
    report = CleaningReport()
    out = convert(df, "currency", ("amount",), "t", report)
    assert out["amount_eur"].round(2).to_list() == [100.0, 100.0, 5.0]
    assert report.steps[0].affected == 1  # unknown currency assumed EUR


def test_duplicates_dropped_on_content_not_id():
    df = pl.DataFrame(
        {
            "transaction_id": ["a", "b", "c"],
            "company_id": ["C"] * 3,
            "product_id": ["P"] * 3,
            "date": [datetime(2025, 1, 1)] * 3,
            "amount": [10.0, 10.0, 11.0],
            "description": ["x", "x", "x"],
        }
    )
    out = _drop_duplicates(df, CleaningReport())
    assert out["transaction_id"].to_list() == ["a", "c"]


def test_outlier_needs_both_relative_and_absolute_excess():
    base = [1000.0] * 990 + [50_000.0] * 10  # p99 = 50k
    df = pl.DataFrame(
        {"company_id": ["C"] * 1003, "amount_eur": base + [2_000_000.0, 900_000.0, 5e9]}
    )
    out = _drop_outliers(df, CleaningReport(), CLEAN)
    kept = out["amount_eur"].to_list()
    assert 2_000_000.0 not in kept  # > 20x p99 and > 1e6
    assert 900_000.0 in kept  # > 20x p99 but below the absolute floor
    assert 5e9 not in kept  # absurd cap


def test_invoice_dates_nulled_when_impossible():
    issued = datetime(2025, 3, 1)
    df = pl.DataFrame(
        {
            "issuance_date": [issued] * 4,
            "due_date": [
                datetime(2025, 3, 31),
                datetime(2020, 1, 1),
                datetime(2025, 3, 31),
                datetime(2025, 3, 31),
            ],
            "payment_date": [
                datetime(2025, 4, 2),
                datetime(2025, 4, 2),
                datetime(2025, 3, 31),
                datetime(3025, 1, 1),
            ],
            "status": ["paid", "paid", "overdue", "paid"],
            "pending_amount": [0.0, 0.0, 100.0, 0.0],
            "amount": [100.0] * 4,
        }
    )
    out = _validate_dates(df, CleaningReport(), CLEAN)
    assert out["due_date"].is_null().to_list() == [False, True, False, False]
    assert out["payment_date"].is_null().to_list() == [False, False, True, True]
    assert out["settled"].to_list() == [True, True, False, True]
