"""Unit tests for the per-variable detail export, on small synthetic frames."""

import json
from datetime import datetime

import polars as pl
import pytest

from ml_service.pulse.clean.pipeline import CleanData
from ml_service.pulse.clean.report import CleaningReport
from ml_service.pulse.details import aging, cash, network, payables, receivables
from ml_service.pulse.details.build import VARIABLE_KEYS, build_payloads
from ml_service.pulse.details.common import DAYS_SHOWN, make_context
from ml_service.pulse.features.months import month_index
from ml_service.pulse.features.network import counterparty_health
from ml_service.pulse.load import RawData

REF = datetime(2026, 8, 1)
SCORED_COLUMNS = (
    "cash_end",
    "cash_min",
    "outflow",
    "outflow_3m",
    "cash_days",
    "cash_min_ratio",
    "loc_util",
    "loc_util_d3",
    "loc_accel",
    "service_3m",
    "maturities_ratio",
    "dpo_days",
    "dpo_d3",
    "terms_days",
    "terms_d6",
    "dso_days",
    "ar90_share",
    "top_client_growth",
    "network_exposure",
)


def scored_frame(companies: list[str], n_months: int = 6) -> pl.DataFrame:
    """Scored panel with every column the detail builders read, ending at the reference month."""
    months = pl.datetime_range(datetime(2026, 3, 1), REF, "1mo", eager=True).to_list()[
        -n_months:
    ]
    rows = [{"company_id": c, "month": m} for c in companies for m in months]
    df = pl.DataFrame(
        rows, schema={"company_id": pl.String, "month": pl.Datetime("us")}
    )
    return df.with_columns(
        *[pl.lit(1.0).alias(c) for c in SCORED_COLUMNS],
        pl.lit(None, dtype=pl.String).alias("top_client_id"),
        pl.lit(2, dtype=pl.UInt32).alias("network_customers"),
    )


def invoices(rows: list[dict]) -> pl.DataFrame:
    schema = {
        "company_id": pl.String,
        "counterparty_id": pl.String,
        "issuance_date": pl.Datetime("us"),
        "due_date": pl.Datetime("us"),
        "payment_date": pl.Datetime("us"),
        "side": pl.String,
        "amount_eur": pl.Float64,
    }
    return pl.DataFrame(rows, schema=schema)


def transactions(rows: list[dict]) -> pl.DataFrame:
    schema = {
        "company_id": pl.String,
        "product_id": pl.String,
        "product_type": pl.String,
        "date": pl.Datetime("us"),
        "amount_eur": pl.Float64,
        "category": pl.String,
        "description": pl.String,
    }
    return pl.DataFrame(rows, schema=schema)


def banking_products(rows: list[dict]) -> pl.DataFrame:
    schema = {
        "product_id": pl.String,
        "company_id": pl.String,
        "label": pl.String,
        "type": pl.String,
        "bank_name": pl.String,
    }
    return pl.DataFrame(rows, schema=schema)


def debt_products(rows: list[dict]) -> pl.DataFrame:
    schema = {
        "product_id": pl.String,
        "company_id": pl.String,
        "label": pl.String,
        "type": pl.String,
        "bank_name": pl.String,
        "granted": pl.Float64,
        "outstanding": pl.Float64,
    }
    return pl.DataFrame(rows, schema=schema)


def snapshot(rows: list[dict]) -> pl.DataFrame:
    return pl.DataFrame(rows, schema={"product_id": pl.String, "granted": pl.Float64})


def clean_data(
    inv: pl.DataFrame | None = None,
    tx: pl.DataFrame | None = None,
    anchors: pl.DataFrame | None = None,
    debt: pl.DataFrame | None = None,
    snap: pl.DataFrame | None = None,
) -> CleanData:
    """Cleaned frames with only the columns the detail builders read."""
    empty = pl.DataFrame({"company_id": []}, schema={"company_id": pl.String})
    return CleanData(
        companies=empty,
        products=empty,
        transactions=tx if tx is not None else transactions([]),
        invoices=inv if inv is not None else invoices([]),
        cash_balances=anchors
        if anchors is not None
        else pl.DataFrame(
            [], schema={"product_id": pl.String, "balance_eur": pl.Float64}
        ),
        debt_products=debt if debt is not None else debt_products([]),
        balances_snapshot=snap if snap is not None else snapshot([]),
        report=CleaningReport(),
    )


def context(clean: CleanData, companies: list[str], banking=None, schedule=None):
    return make_context(
        clean,
        banking if banking is not None else banking_products([]),
        schedule
        if schedule is not None
        else pl.DataFrame(
            [],
            schema={
                "product_id": pl.String,
                "next_payment_date": pl.Datetime("us"),
                "total_periods": pl.Int64,
            },
        ),
        scored_frame(companies),
        companies,
    )


def ar(counterparty: str, issuance, due, payment, amount: float, company="C1") -> dict:
    return {
        "company_id": company,
        "counterparty_id": counterparty,
        "issuance_date": issuance,
        "due_date": due,
        "payment_date": payment,
        "side": "ar",
        "amount_eur": amount,
    }


def ap(counterparty: str, issuance, due, payment, amount: float, company="C1") -> dict:
    return {**ar(counterparty, issuance, due, payment, amount, company), "side": "ap"}


# --- aging ---------------------------------------------------------------


def test_aging_puts_every_open_invoice_in_its_bucket():
    inv = invoices(
        [
            ar("X1", datetime(2026, 8, 1), datetime(2026, 9, 15), None, 10.0),
            ar("X2", datetime(2026, 7, 1), datetime(2026, 8, 20), None, 20.0),
            ar("X3", datetime(2026, 6, 1), datetime(2026, 7, 20), None, 30.0),
            ar("X4", datetime(2026, 5, 1), datetime(2026, 6, 25), None, 40.0),
            ar("X5", datetime(2026, 1, 1), datetime(2026, 1, 10), None, 50.0),
            ar("X5", datetime(2026, 1, 1), datetime(2026, 1, 10), None, 5.0),
        ]
    )
    block = aging.blocks(context(clean_data(inv), ["C1"]))["ar90"]["C1"]
    assert [(b["bucket"], b["amount"], b["invoices"]) for b in block["aging"]] == [
        ("al_dia", 10.0, 1),
        ("1_30", 20.0, 1),
        ("31_60", 30.0, 1),
        ("61_90", 40.0, 1),
        ("mas_90", 55.0, 2),
    ]
    top = block["debtors"][0]
    assert top["counterparty_id"] == "X5"
    assert (top["open"], top["over_90"], top["share_over_90"]) == (55.0, 55.0, 1.0)
    assert block["months"][-1]["over_90"] == 55.0


def test_aging_is_five_zero_buckets_without_receivables():
    block = aging.blocks(context(clean_data(), ["C1"]))["ar90"]["C1"]
    assert [b["bucket"] for b in block["aging"]] == [
        "al_dia",
        "1_30",
        "31_60",
        "61_90",
        "mas_90",
    ]
    assert all(b["amount"] == 0.0 and b["invoices"] == 0 for b in block["aging"])
    assert block["debtors"] == []


# --- payables ------------------------------------------------------------


def test_supplier_dpo_is_value_weighted_over_the_trailing_quarter():
    inv = invoices(
        [
            ap(
                "S1",
                datetime(2026, 6, 1),
                datetime(2026, 7, 1),
                datetime(2026, 7, 31),
                100.0,
            ),
            ap(
                "S1",
                datetime(2026, 7, 1),
                datetime(2026, 8, 1),
                datetime(2026, 8, 11),
                300.0,
            ),
            ap(
                "S1",
                datetime(2026, 1, 1),
                datetime(2026, 2, 1),
                datetime(2026, 2, 1),
                900.0,
            ),
            ap(
                "S2",
                datetime(2026, 8, 1),
                datetime(2026, 8, 21),
                datetime(2026, 8, 31),
                50.0,
            ),
        ]
    )
    block = payables.blocks(context(clean_data(inv), ["C1"]))["dpo"]["C1"]
    first, second = block["suppliers"]
    assert first["counterparty_id"] == "S1"
    assert (first["paid_3m"], first["invoices"]) == (400.0, 2)
    assert first["dpo_days"] == 45.75
    assert first["terms_days"] == 30.75
    assert first["late_days"] == 15.0
    assert second["counterparty_id"] == "S2"
    assert (second["dpo_days"], second["terms_days"], second["late_days"]) == (
        30.0,
        20.0,
        10.0,
    )


def test_supplier_terms_rank_the_trailing_half_year():
    inv = invoices(
        [
            ap("S1", datetime(2026, 3, 1), datetime(2026, 4, 1), None, 100.0),
            ap("S2", datetime(2026, 8, 1), datetime(2026, 9, 1), None, 200.0),
            ap("S3", datetime(2025, 1, 1), datetime(2025, 2, 1), None, 900.0),
        ]
    )
    block = payables.blocks(context(clean_data(inv), ["C1"]))["terms"]["C1"]
    assert [s["counterparty_id"] for s in block["suppliers"]] == ["S2", "S1"]
    assert block["suppliers"][0]["billed_6m"] == 200.0
    assert block["suppliers"][0]["terms_days"] == 31.0


def test_blocks_are_empty_for_a_company_without_invoices():
    ctx = context(clean_data(), ["C1"])
    assert payables.blocks(ctx)["dpo"]["C1"]["suppliers"] == []
    assert payables.blocks(ctx)["terms"]["C1"]["suppliers"] == []
    assert receivables.blocks(ctx)["dso"]["C1"]["customers"] == []
    assert receivables.blocks(ctx)["top_client"]["C1"]["customers"] == []
    assert network.blocks(ctx)["network"]["C1"]["customers"] == []
    assert payables.blocks(ctx)["dpo"]["C1"]["months"][-1]["month"] == "2026-08"


# --- receivables ---------------------------------------------------------


def test_top_customers_compare_the_quarter_with_the_previous_one():
    rows = [
        ar("K1", datetime(2026, 8, 1), None, None, 200.0),
        ar("K1", datetime(2026, 4, 1), None, None, 100.0),
        ar("K2", datetime(2026, 7, 1), None, None, 50.0),
    ]
    block = receivables.blocks(context(clean_data(invoices(rows)), ["C1"]))[
        "top_client"
    ]["C1"]
    first = block["customers"][0]
    assert first["counterparty_id"] == "K1"
    assert (first["billed_3m"], first["billed_prev_3m"]) == (200.0, 100.0)
    assert first["growth"] == 1.0
    assert round(sum(c["share_12m"] for c in block["customers"]), 6) == 1.0
    assert first["top"] is False


# --- network -------------------------------------------------------------


def _monthly_ar(counterparty: str, late_days: int) -> list[dict]:
    """One paid receivable a month from 2025-09 to 2026-08, settled ``late_days`` late."""
    months = pl.datetime_range(datetime(2025, 9, 1), REF, "1mo", eager=True).to_list()
    return [
        ar(
            counterparty,
            month,
            month.replace(day=15),
            month.replace(day=15 + late_days),
            100.0,
        )
        for month in months
    ]


def test_network_customers_carry_their_health_and_share_one():
    inv = invoices(_monthly_ar("N1", 0) + _monthly_ar("N2", 5))
    ctx = context(clean_data(inv), ["C1"])
    block = network.blocks(ctx)["network"]["C1"]
    assert {c["counterparty_id"] for c in block["customers"]} == {"N1", "N2"}
    assert round(sum(c["share"] for c in block["customers"]), 6) == 1.0
    health = counterparty_health(
        inv, ctx.scored.select(month_index("month").alias("_mi")).unique()
    ).filter(pl.col("_mi") == month_index(pl.lit(REF)))
    expected = {r["counterparty_id"]: r["health"] for r in health.to_dicts()}
    for customer in block["customers"]:
        assert customer["health"] == pytest.approx(
            round(expected[customer["counterparty_id"]], 2)
        )
        assert customer["n_companies"] == 1


# --- cash ----------------------------------------------------------------


def _cash_fixture() -> CleanData:
    tx = transactions(
        [
            {
                "company_id": "C1",
                "product_id": "P1",
                "product_type": "checking",
                "date": day,
                "amount_eur": 10.0,
                "category": "other",
                "description": "x",
            }
            for day in pl.datetime_range(
                datetime(2026, 6, 1), datetime(2026, 8, 30), "1d", eager=True
            ).to_list()
        ]
    )
    anchors = pl.DataFrame(
        {"product_id": ["P1"], "balance_eur": [1000.0]},
        schema={"product_id": pl.String, "balance_eur": pl.Float64},
    )
    return clean_data(tx=tx, anchors=anchors)


def test_daily_cash_series_ends_at_the_month_end_and_is_ascending():
    ctx = context(
        _cash_fixture(),
        ["C1"],
        banking=banking_products(
            [
                {
                    "product_id": "P1",
                    "company_id": "C1",
                    "label": "CHECKING_01",
                    "type": "checking",
                    "bank_name": "Banco",
                }
            ]
        ),
    )
    blocks = cash.blocks(ctx)
    daily = blocks["cash_days"]["C1"]["daily"]
    assert len(daily) == DAYS_SHOWN
    assert daily[0]["day"] == "2026-07-01"
    assert daily[-1]["day"] == "2026-08-31"
    assert [d["day"] for d in daily] == sorted(d["day"] for d in daily)
    assert blocks["cash_days"]["C1"]["accounts"][0]["label"] == "CHECKING_01"
    assert blocks["cash_min"]["C1"]["min_day"]["day"] == "2026-08-01"
    assert blocks["cash_min"]["C1"]["daily"] == daily


# --- payload -------------------------------------------------------------


def _raw(banking: pl.DataFrame, schedule: pl.DataFrame) -> RawData:
    empty = pl.DataFrame()
    return RawData(
        groups=empty,
        companies=empty,
        banking_products=banking,
        debt_products=empty,
        debt_schedule_config=schedule,
        balances=empty,
        invoices=empty,
        transactions=empty,
    )


def test_payload_carries_every_variable_and_serialises():
    inv = invoices(
        [
            ap(
                "S1",
                datetime(2026, 7, 1),
                datetime(2026, 8, 1),
                datetime(2026, 8, 5),
                10.0,
            )
        ]
    )
    debt = debt_products(
        [
            {
                "product_id": "L1",
                "company_id": "C1",
                "label": "LINEOFCREDIT_01",
                "type": "lineofcredit",
                "bank_name": "BBVA",
                "granted": -1000.0,
                "outstanding": -400.0,
            }
        ]
    )
    clean = clean_data(inv=inv, debt=debt, snap=snapshot([]))
    schedule = pl.DataFrame(
        {
            "product_id": ["L1"],
            "next_payment_date": [datetime(2026, 9, 30)],
            "total_periods": [12],
        }
    )
    raw = _raw(banking_products([]), schedule)
    payloads = build_payloads(clean, raw, scored_frame(["C1"]), ["C1"])
    payload = payloads["C1"]
    assert payload["company_id"] == "C1"
    assert payload["month"] == "2026-08"
    assert list(payload["variables"]) == list(VARIABLE_KEYS)
    line = payload["variables"]["loc_util"]["lines"][0]
    assert (line["limit"], line["drawn"], line["util"]) == (1000.0, 400.0, 0.4)
    product = payload["variables"]["maturities"]["products"][0]
    assert product["next_payment_date"] == "2026-09-30"
    assert product["periods_left"] == 12
    assert json.loads(json.dumps(payload, ensure_ascii=False))["month"] == "2026-08"
