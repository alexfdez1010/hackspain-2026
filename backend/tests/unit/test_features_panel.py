"""Unit tests for the assembled company x month panel."""

from __future__ import annotations

from datetime import datetime

import polars as pl
import pytest
from conftest import invoice_frame, tx_frame

from ml_service.xray.config import FEATURE_SPECS, LAST_FULL_MONTH
from ml_service.xray.features.panel import build_panel


@pytest.fixture
def panel(make_dataset):
    """Panel for two companies with different onboarding months."""
    ds = make_dataset(
        transactions=tx_frame(
            [
                {
                    "date": datetime(2024, 9, 10),
                    "amount": 1000.0,
                    "category": "collection",
                },
                {
                    "date": datetime(2024, 12, 10),
                    "amount": -500.0,
                    "category": "supplier",
                },
                {
                    "date": datetime(2025, 6, 10),
                    "amount": 400.0,
                    "category": "collection",
                },
                {
                    "company_id": "C2",
                    "product_id": "P2",
                    "date": datetime(2025, 3, 10),
                    "amount": 300.0,
                    "category": "collection",
                },
            ]
        ),
        banking_products=pl.DataFrame(
            {
                "product_id": ["P1", "P2"],
                "company_id": ["C1", "C2"],
                "type": ["checking", "checking"],
            }
        ),
        debt_products=pl.DataFrame(
            {
                "product_id": ["L1"],
                "company_id": ["C1"],
                "type": ["lineofcredit"],
                "service": ["bank"],
                "granted": [-2000.0],
                "outstanding": [-500.0],
            }
        ),
        balances=pl.DataFrame({"product_id": ["P1", "P2"], "balance": [900.0, 300.0]}),
        invoices=invoice_frame(
            [
                {
                    "issuance_date": datetime(2024, 9, 5),
                    "due_date": datetime(2024, 9, 30),
                    "payment_date": datetime(2024, 11, 2),
                    "amount": 300.0,
                },
                {
                    "issuance_date": datetime(2024, 10, 5),
                    "due_date": datetime(2024, 10, 31),
                    "payment_date": datetime(2025, 1, 15),
                    "amount": -150.0,
                },
                {
                    "company_id": "C2",
                    "issuance_date": datetime(2025, 3, 5),
                    "due_date": datetime(2025, 3, 31),
                    "payment_date": datetime(2025, 6, 15),
                    "amount": -120.0,
                },
            ]
        ),
        companies=pl.DataFrame(
            {"company_id": ["C1", "C2"], "group_id": ["G1", "G1"]},
        ),
    )
    return build_panel(ds)


def test_grid_runs_from_first_activity_to_last_full_month(panel):
    """Each company gets a dense monthly grid starting at its first active month."""
    c1 = panel.filter(pl.col("company_id") == "C1").sort("month")
    c2 = panel.filter(pl.col("company_id") == "C2").sort("month")
    assert c1.height == 24
    assert c2.height == 18
    assert c1["month"].min() == datetime(2024, 9, 1)
    assert c1["month"].max() == LAST_FULL_MONTH
    assert c2["month"].min() == datetime(2025, 3, 1)
    assert c1["months_observed"].to_list() == list(range(1, 25))


def test_flow_columns_are_zero_filled_on_quiet_months(panel):
    """A month without transactions is a real zero, not a hole."""
    c1 = panel.filter(pl.col("company_id") == "C1").sort("month")
    assert c1["inflow"].to_list()[:4] == [1000.0, 0.0, 0.0, 0.0]
    assert c1["outflow"].to_list()[3] == 500.0
    assert c1["inflow"].null_count() == 0


def test_rolling_windows_never_look_forward(panel):
    """The trailing 3-month sum at month m only uses months m-2..m."""
    c1 = panel.filter(pl.col("company_id") == "C1").sort("month")
    inflow_3m = c1["inflow_3m"].to_list()
    assert inflow_3m[:5] == [1000.0, 1000.0, 1000.0, 0.0, 0.0]
    months = c1["month"].to_list()
    june = months.index(datetime(2025, 6, 1))
    assert c1["inflow_3m"].to_list()[june - 1] == 0.0


def test_cash_is_forward_filled_between_snapshots(panel):
    """Cash carries over into months without movements."""
    c1 = panel.filter(pl.col("company_id") == "C1").sort("month")
    cash = c1["cash_end"].to_list()
    assert cash[0] == pytest.approx(1000.0)
    assert cash[1] == pytest.approx(1000.0)
    assert cash[-1] == pytest.approx(900.0)


def test_every_declared_feature_exists_and_is_scale_free(panel):
    """All FEATURE_SPECS columns are produced and stay inside their clip bounds."""
    missing = [s.name for s in FEATURE_SPECS if s.name not in panel.columns]
    assert missing == []
    assert panel["cash_runway_months"].max() <= 24
    assert panel["net_margin"].drop_nulls().abs().max() <= 1.0
    assert panel["group_id"].to_list().count("G1") == panel.height
