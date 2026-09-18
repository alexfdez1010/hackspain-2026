"""Unit tests for the transaction-derived monthly features."""

from __future__ import annotations

from datetime import datetime

import polars as pl
import pytest
from conftest import M, tx_frame

from ml_service.xray.features.transactions import (
    build_transaction_features,
    cash_features,
    flow_features,
    loc_features,
    reconstruct_balances,
)


def _typed(rows: list[dict], type_: str = "checking") -> pl.DataFrame:
    """Transactions already joined with product type and final balance."""
    return tx_frame(rows).with_columns(
        pl.lit(type_).alias("type"),
        pl.lit(None, dtype=pl.Float64).alias("final_balance"),
    )


def test_reconstruct_balances_rebuilds_running_balance():
    """The running balance walks back from the final snapshot."""
    tx = _typed(
        [
            {"date": datetime(2024, 9, 5), "amount": 100.0},
            {"date": datetime(2024, 10, 5), "amount": -40.0},
        ]
    ).with_columns(pl.lit(60.0).alias("final_balance"))
    out = reconstruct_balances(tx).sort("month")
    assert out["balance_end"].to_list() == [100.0, 60.0]
    assert out["neg_day_share"].to_list() == [0.0, 0.0]


def test_reconstruct_balances_flags_negative_days():
    """A month whose only day is negative has a negative-day share of 1."""
    tx = _typed(
        [
            {"date": datetime(2024, 9, 5), "amount": -50.0},
            {"date": datetime(2024, 10, 5), "amount": 50.0},
        ]
    ).with_columns(pl.lit(0.0).alias("final_balance"))
    out = reconstruct_balances(tx).sort("month")
    assert out["balance_end"].to_list() == [-50.0, 0.0]
    assert out["neg_day_share"].to_list() == [1.0, 0.0]


def test_cash_features_only_aggregate_cash_accounts():
    """Card accounts are financing, not cash, so they are excluded."""
    balances = pl.DataFrame(
        {
            "product_id": ["P1", "P2"],
            "company_id": ["C1", "C1"],
            "type": ["checking", "card"],
            "month": [M[0], M[0]],
            "balance_end": [100.0, -900.0],
            "balance_min": [20.0, -900.0],
            "neg_day_share": [0.0, 1.0],
        }
    )
    out = cash_features(balances)
    assert out["cash_end"].to_list() == [100.0]
    assert out["n_cash_accounts"].to_list() == [1]


def test_loc_features_utilisation(make_dataset):
    """Drawn amount is the negative part of the line balance against the limit."""
    ds = make_dataset(
        debt_products=pl.DataFrame(
            {
                "product_id": ["L1"],
                "company_id": ["C1"],
                "type": ["lineofcredit"],
                "granted": [-1000.0],
            }
        )
    )
    balances = pl.DataFrame(
        {
            "product_id": ["L1"],
            "company_id": ["C1"],
            "type": ["lineofcredit"],
            "month": [M[0]],
            "balance_end": [-250.0],
            "balance_min": [-250.0],
            "neg_day_share": [1.0],
        }
    )
    out = loc_features(balances, ds)
    assert out["loc_drawn"].to_list() == [250.0]
    assert out["loc_limit"].to_list() == [1000.0]


def test_flow_features_excludes_intercompany_transfers():
    """Intra-group traspasos never count as operating inflow or outflow."""
    tx = _typed(
        [
            {"amount": 500.0, "category": "collection", "description": "COBRO"},
            {
                "amount": 900.0,
                "category": "transfer",
                "description": "TRASPASO ENTRE CUENTAS",
            },
            {"amount": -200.0, "category": "salary", "description": "NOMINA"},
        ]
    )
    out = flow_features(tx)
    assert out["inflow"].to_list() == [500.0]
    assert out["outflow"].to_list() == [200.0]
    assert out["payroll"].to_list() == [200.0]
    assert out["collections"].to_list() == [500.0]
    assert out["n_tx"].to_list() == [3]


def test_flow_features_counts_stress_narratives():
    """Spanish stress narratives are counted by family."""
    tx = _typed(
        [
            {"amount": -30.0, "description": "DEVOLUCION RECIBO LUZ"},
            {"amount": -12.0, "description": "INTERESES DEUDOR POR DESCUBIERTO"},
            {"amount": -80.0, "description": "EMBARGO AEAT"},
        ]
    )
    out = flow_features(tx)
    assert out["returned_debit_n"].to_list() == [1]
    assert out["overdraft_n"].to_list() == [1]
    assert out["seizure_n"].to_list() == [1]
    assert out["returned_debit_amt"].to_list() == [30.0]


def test_build_transaction_features_end_to_end(make_dataset):
    """Flows, cash and line-of-credit blocks join on company and month."""
    ds = make_dataset(
        transactions=tx_frame(
            [
                {
                    "date": datetime(2024, 9, 3),
                    "amount": 400.0,
                    "category": "collection",
                },
                {
                    "date": datetime(2024, 10, 3),
                    "amount": -150.0,
                    "category": "supplier",
                },
                {"date": datetime(2024, 10, 4), "amount": 20.0, "status": "pending"},
            ]
        ),
        banking_products=pl.DataFrame(
            {"product_id": ["P1"], "company_id": ["C1"], "type": ["checking"]}
        ),
        debt_products=pl.DataFrame(
            {
                "product_id": ["L1"],
                "company_id": ["C1"],
                "type": ["loan"],
                "granted": [-100.0],
            }
        ),
        balances=pl.DataFrame({"product_id": ["P1"], "balance": [250.0]}),
    )
    out = build_transaction_features(ds).sort("month")
    assert out.height == 2
    assert out["inflow"].to_list() == [400.0, 0.0]
    assert out["cash_end"].to_list() == pytest.approx([400.0, 250.0])
