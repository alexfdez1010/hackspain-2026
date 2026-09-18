"""Unit tests for the invoice-derived monthly features."""

from __future__ import annotations

from datetime import datetime

import pytest
from conftest import invoice_frame

from ml_service.xray.features.invoices import (
    _clean,
    build_invoice_features,
    concentration_features,
    issued_features,
    overdue_features,
    paid_delay_features,
)


def _cleaned(rows: list[dict], make_dataset):
    return _clean(make_dataset(invoices=invoice_frame(rows)))


def test_clean_assigns_side_and_accounting_value(make_dataset):
    """Positive amounts are receivables, negative ones payables, FX applied."""
    out = _cleaned(
        [
            {"operation_id": "A", "amount": 100.0, "exchange_rate": 1.5},
            {"operation_id": "B", "amount": -40.0, "exchange_rate": None},
            {"operation_id": "C", "amount": 999.0, "status": "cancel"},
        ],
        make_dataset,
    ).sort("operation_id")
    assert out["operation_id"].to_list() == ["A", "B"]
    assert out["side"].to_list() == ["ar", "ap"]
    assert out["value"].to_list() == pytest.approx([150.0, 40.0])


def test_clean_rejects_absurd_dates_and_falls_back_to_issuance(make_dataset):
    """A due date outside the plausible window is replaced by the issuance date."""
    out = _cleaned(
        [
            {
                "issuance_date": datetime(2025, 3, 1),
                "due_date": datetime(1999, 1, 1),
                "amount": 10.0,
            }
        ],
        make_dataset,
    )
    assert out["due_date"].to_list() == [datetime(2025, 3, 1)]


def test_issued_features_split_by_side(make_dataset):
    """Issued volume is pivoted into receivable and payable columns."""
    inv = _cleaned(
        [
            {"issuance_date": datetime(2025, 1, 10), "amount": 100.0},
            {"issuance_date": datetime(2025, 1, 20), "amount": -60.0},
        ],
        make_dataset,
    )
    out = issued_features(inv)
    assert out["issued_ar"].to_list() == [100.0]
    assert out["issued_ap"].to_list() == [60.0]


def test_paid_delay_is_value_weighted(make_dataset):
    """A large late invoice dominates a small punctual one."""
    inv = _cleaned(
        [
            {
                "due_date": datetime(2025, 1, 1),
                "payment_date": datetime(2025, 1, 31),
                "amount": 900.0,
            },
            {
                "due_date": datetime(2025, 1, 1),
                "payment_date": datetime(2025, 1, 1),
                "amount": 100.0,
            },
        ],
        make_dataset,
    )
    out = paid_delay_features(inv)
    assert out["delay_days_ar"].to_list() == pytest.approx([27.0])
    assert out["late_share_ar"].to_list() == pytest.approx([0.5])


def test_overdue_is_point_in_time(make_dataset):
    """An invoice counts as overdue from its due month and never after payment."""
    inv = _cleaned(
        [
            {
                "due_date": datetime(2025, 1, 15),
                "payment_date": datetime(2025, 4, 10),
                "amount": 500.0,
            }
        ],
        make_dataset,
    )
    out = overdue_features(inv).sort("month")
    months = [m.strftime("%Y-%m") for m in out["month"].to_list()]
    assert months[0] == "2025-01"
    assert all(m < "2025-04" for m in months)
    assert out["overdue_ar"].to_list()[0] == 500.0


def test_overdue_ignores_invoices_paid_before_their_due_month(make_dataset):
    """Paying inside the due month leaves no overdue balance at all."""
    inv = _cleaned(
        [
            {
                "due_date": datetime(2025, 1, 15),
                "payment_date": datetime(2025, 1, 20),
                "amount": 500.0,
            }
        ],
        make_dataset,
    )
    assert overdue_features(inv).height == 0


def test_concentration_single_customer_is_one(make_dataset):
    """A company billing a single customer has an HHI of 1."""
    inv = _cleaned(
        [
            {
                "issuance_date": datetime(2025, 2, 3),
                "amount": 100.0,
                "counterparty_id": "X",
            },
            {
                "issuance_date": datetime(2025, 2, 9),
                "amount": 300.0,
                "counterparty_id": "X",
            },
        ],
        make_dataset,
    )
    out = concentration_features(inv).sort("month")
    assert out["customer_concentration"].to_list() == pytest.approx([1.0, 1.0, 1.0])
    assert out["n_customers"].to_list() == [1, 1, 1]


def test_concentration_two_equal_customers(make_dataset):
    """Two customers of equal weight give an HHI of 0.5."""
    inv = _cleaned(
        [
            {
                "issuance_date": datetime(2025, 2, 3),
                "amount": 100.0,
                "counterparty_id": "X",
            },
            {
                "issuance_date": datetime(2025, 2, 9),
                "amount": 100.0,
                "counterparty_id": "Y",
            },
        ],
        make_dataset,
    )
    out = concentration_features(inv).sort("month")
    assert out["customer_concentration"].to_list()[0] == pytest.approx(0.5)


def test_build_invoice_features_joins_every_block(make_dataset):
    """The invoice block returns one row per company-month with all families."""
    ds = make_dataset(
        invoices=invoice_frame(
            [
                {
                    "issuance_date": datetime(2025, 1, 5),
                    "due_date": datetime(2025, 1, 31),
                    "payment_date": datetime(2025, 3, 2),
                    "amount": 200.0,
                }
            ]
        )
    )
    out = build_invoice_features(ds)
    assert {
        "issued_ar",
        "delay_days_ar",
        "overdue_ar",
        "customer_concentration",
    } <= set(out.columns)
    assert out.height >= 1
