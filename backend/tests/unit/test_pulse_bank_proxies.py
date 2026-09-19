"""Unit tests for the bank-side proxies of #8, #9 and #12 on tiny transaction frames."""

from datetime import datetime

import polars as pl

from ml_service.pulse.features.bank_proxies import bank_proxy_features
from ml_service.pulse.features.months import month_grid


def _month(i: int) -> datetime:
    """Mid-month datetime ``i`` months after FIRST_MONTH (2024-09)."""
    return datetime(2024 + (8 + i) // 12, (8 + i) % 12 + 1, 15)


def _tx(rows: list[tuple]) -> pl.DataFrame:
    """(company, month_index, amount, category, counterparty_ref) -> cleaned-transactions frame."""
    return pl.DataFrame(
        {
            "transaction_id": [f"T{i}" for i in range(len(rows))],
            "company_id": [r[0] for r in rows],
            "product_id": [f"P_{r[0]}" for r in rows],
            "product_type": ["checking"] * len(rows),
            "date": [_month(r[1]) for r in rows],
            "amount_eur": [float(r[2]) for r in rows],
            "category": [r[3] for r in rows],
            "description": [""] * len(rows),
            "counterparty_id": [None] * len(rows),
            "counterparty_ref": [r[4] for r in rows],
        }
    )


def _grid(companies: list[str]) -> pl.DataFrame:
    return month_grid(
        pl.DataFrame(
            {"company_id": companies, "first_month": [_month(0)] * len(companies)}
        ).with_columns(pl.col("first_month").dt.truncate("1mo"))
    )


def _at(panel: pl.DataFrame, company: str, i: int) -> dict:
    return panel.filter(
        (pl.col("company_id") == company)
        & (pl.col("month") == _month(i).replace(day=1))
    ).to_dicts()[0]


def test_returned_share_is_returned_over_collections_trailing_3m():
    rows = [("C1", i, 100, "collection", None) for i in range(3)]
    rows.append(("C1", 2, -30, "collection_refund", None))
    panel = bank_proxy_features(_tx(rows), _grid(["C1"]))
    assert abs(_at(panel, "C1", 2)["returned_share"] - 0.1) < 1e-9
    assert _at(panel, "C1", 1)["returned_share"] == 0.0
    assert _at(panel, "C1", 5)["returned_share"] is None  # nothing collected


def test_top_client_growth_from_bank_collections_and_coverage():
    rows = [("C1", i, 100, "collection", "X") for i in range(6)]
    rows += [("C1", i, 50, "collection", "X") for i in range(6, 9)]
    rows.append(("C1", 8, 100, "collection", None))  # unattributed inflow
    panel = bank_proxy_features(_tx(rows), _grid(["C1"]))
    row = _at(panel, "C1", 8)
    assert row["top_client_bank_id"] == "X"
    assert abs(row["top_client_growth_bank"] - (-0.5)) < 1e-9
    assert abs(row["top_client__proxy_coverage"] - 750 / 850) < 1e-9


def test_network_uses_what_shared_payers_pay_other_companies():
    rows = [("C1", i, 100, "collection", "X") for i in range(6)]
    rows += [("C1", i, 100, "collection", "Y") for i in range(6)]  # Y pays only C1
    rows += [("C2", i, 100, "collection", "X") for i in range(3)]
    rows += [("C2", i, 200, "collection", "X") for i in range(3, 6)]
    panel = bank_proxy_features(_tx(rows), _grid(["C1", "C2"]))
    c1 = _at(panel, "C1", 5)
    # X paid C2 300 in the 6m ending month 2 and 900 in the 6m ending month 5 -> +200 %, clipped to +1
    assert abs(c1["network_exposure_bank"] - 1.0) < 1e-9
    assert c1["network_payers_bank"] == 1
    assert abs(c1["network__proxy_coverage"] - 0.5) < 1e-9  # Y is not a network payer
    assert _at(panel, "C1", 1)["network_exposure_bank"] is None  # no 3m history yet
