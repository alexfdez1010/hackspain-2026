"""Unit tests for the PULSE Advisor: rules, sizing, pricing, risk scorecard and engine payload."""

from __future__ import annotations

import numpy as np
import pytest

from ml_service.pulse.recommend import config as cfg
from ml_service.pulse.recommend.catalogue import BY_KEY, PRODUCTS
from ml_service.pulse.recommend.engine import Recommender
from ml_service.pulse.recommend.levers import levers
from ml_service.pulse.recommend.pricing import annualise, price, risk_premium
from ml_service.pulse.recommend.risk import FEATURES, RiskModel, snapshot_features
from ml_service.pulse.recommend.rules import RULES, assess_all
from ml_service.pulse.recommend.sizing import annuity, round_amount, size
from ml_service.pulse.recommend.snapshot import (
    CompanySnapshot,
    Holdings,
    InvoiceBook,
    Outlook,
    VariableReading,
)
from ml_service.pulse.variables import VARIABLES

PILLARS_OK = {"liquidez": 55.0, "deuda": 55.0, "pago": 55.0, "cobro": 55.0}


def reading(raw: float | None, score: float = 50.0) -> VariableReading:
    return VariableReading(
        score=score if raw is not None else None, raw=raw, known=raw is not None
    )


def snapshot(**overrides) -> CompanySnapshot:
    """A mid-table company with thin cash and no ERP; tests override what they need."""
    raw = {
        "cash_days": 12.0,
        "cash_min": 0.1,
        "loc_util": None,
        "loc_accel": None,
        "dpo": None,
        "terms": None,
        "dso": None,
        "ar90": None,
        "top_client": None,
        "maturities": 0.2,
        "network": None,
    }
    raw.update(overrides.pop("raw", {}))
    base = {
        "company_id": "C1",
        "month": "2026-08",
        "pulse": 55.0,
        "pulse_raw": 50.0,
        "confidence": 0.7,
        "months_observed": 12,
        "pillars": dict(PILLARS_OK),
        "variables": {k: reading(v) for k, v in raw.items()},
        "cash_end": 40_000.0,
        "monthly_outflow": 100_000.0,
        "monthly_collections": 110_000.0,
        "service_3m": 0.0,
        "pulse_raw_d3": 0.0,
    }
    base.update(overrides)
    return CompanySnapshot(**base)


def model() -> RiskModel:
    """A hand-set scorecard: liquidity dominates, everything else mild."""
    return RiskModel(
        mean=[50.0, 50.0, 50.0, 50.0, 0.6, 2.5],
        std=[25.0, 25.0, 25.0, 25.0, 0.2, 0.5],
        coef=[-1.9, -0.15, 0.0, -0.1, -0.03, -0.35],
        intercept=-1.6,
        base_rate=0.22,
    )


# --- catalogue & rules -------------------------------------------------------


def test_every_product_has_a_rule_and_a_sizer():
    assert set(RULES) == {p.key for p in PRODUCTS}
    for p in PRODUCTS:
        assert p.min_spread_bps < p.max_spread_bps


def test_thin_cash_company_gets_a_credit_line_with_variable_backed_reasons():
    a = {x.product: x for x in assess_all(snapshot())}
    line = a["credit_line"]
    assert line.eligible and line.fit >= cfg.MIN_FIT_TO_RECOMMEND
    codes = {r.code for r in line.reasons}
    assert {"caja_corta", "minimo_intramensual", "sin_linea"} <= codes
    assert all(
        r.variable in {v.key for v in VARIABLES} for r in line.reasons if r.variable
    )
    assert not a["treasury_deposit"].eligible
    assert not a["factoring"].eligible  # no ERP invoices


def test_low_confidence_blocks_credit_but_explains_why():
    a = {x.product: x for x in assess_all(snapshot(confidence=0.1))}
    assert any(r.code == "datos_insuficientes" for r in a["credit_line"].reasons)


def test_low_pulse_only_unlocks_refinancing_when_maturities_bite():
    s = snapshot(
        pulse=20.0,
        raw={"maturities": 4.0},
        holdings=Holdings(types=("loan",), loan_outstanding=200_000.0, n_loans=1),
    )
    a = {x.product: x for x in assess_all(s)}
    assert not a["credit_line"].eligible
    assert a["refinancing"].eligible and a["refinancing"].fit > 80


def test_excess_cash_company_is_offered_a_deposit_not_credit():
    s = snapshot(
        pulse=85.0,
        raw={"cash_days": 300.0, "cash_min": 3.0, "maturities": 0.0},
        cash_end=1_500_000.0,
    )
    a = {x.product: x for x in assess_all(s)}
    assert a["treasury_deposit"].eligible
    assert not a["credit_line"].eligible


def test_factoring_needs_current_receivables_and_slow_collection():
    book = InvoiceBook(
        has_erp=True, open_ar=600_000, eligible_ar=500_000, ar_monthly=200_000
    )
    slow = snapshot(raw={"dso": 70.0, "ar90": 0.1}, invoices=book)
    stale = snapshot(raw={"dso": 70.0, "ar90": 0.6}, invoices=book)
    assert {x.product: x for x in assess_all(slow)}["factoring"].eligible
    blocked = {x.product: x for x in assess_all(stale)}["factoring"]
    assert not blocked.eligible and blocked.reasons[0].code == "cartera_vencida"


def test_line_increase_requires_an_existing_line_near_the_top():
    held = Holdings(types=("lineofcredit",), line_limit=100_000, line_drawn=90_000)
    a = {
        x.product: x for x in assess_all(snapshot(raw={"loc_util": 0.9}, holdings=held))
    }
    assert a["credit_line_increase"].eligible
    idle = {
        x.product: x for x in assess_all(snapshot(raw={"loc_util": 0.2}, holdings=held))
    }
    assert not idle["credit_line_increase"].eligible


# --- sizing & pricing --------------------------------------------------------


def test_round_amount_clamps_and_steps():
    assert round_amount(123_456) == 120_000
    assert round_amount(3_000) == 0.0
    assert round_amount(9e9) == cfg.MAX_FACILITY_EUR


def test_credit_line_size_follows_the_pulse_band_and_nets_available_line():
    s = snapshot(pulse=80.0, holdings=Holdings(line_limit=50_000, line_drawn=20_000))
    sized = size("credit_line", s)
    assert sized.amount == round_amount(1.5 * 100_000 - 30_000)
    assert "1.50 meses" in sized.formula


def test_annuity_matches_a_known_instalment():
    assert annuity(100_000, 0.06, 12) == pytest.approx(8_606.64, rel=1e-4)
    assert annuity(1_200, 0.0, 12) == 100.0


def test_price_decomposes_and_sums_to_the_rate():
    s = snapshot(
        confidence=0.5, outlook=Outlook(pulse_pred=40.0)
    )  # decline of 15 points
    p = price(BY_KEY["credit_line"], s, p_stress_6m=0.2)
    keys = [c.key for c in p.components]
    assert keys == [
        "referencia",
        "margen_producto",
        "prima_riesgo",
        "incertidumbre_datos",
        "tendencia",
    ]
    assert sum(c.bps for c in p.components) / 10_000 == pytest.approx(
        p.annual_rate, abs=1e-4
    )
    premium, pd12 = risk_premium(0.2, 0.45)
    assert pd12 == pytest.approx(annualise(0.2))
    assert p.expected_loss_bps == premium
    assert next(c.bps for c in p.components if c.key == "incertidumbre_datos") == 38


def test_price_is_clamped_to_the_product_spread_band_and_says_so():
    line = BY_KEY["credit_line"]
    p = price(line, snapshot(confidence=0.3), p_stress_6m=0.95)
    assert p.clamped and p.spread_bps == line.max_spread_bps
    assert p.annual_rate == pytest.approx(cfg.EURIBOR_12M + line.max_spread_bps / 1e4)


def test_reference_rate_only_moves_the_reference_line():
    s = snapshot()
    base = price(BY_KEY["credit_line"], s, 0.2)
    other = price(BY_KEY["credit_line"], s, 0.2, reference_rate=0.035)
    assert other.spread_bps == base.spread_bps
    assert other.annual_rate == pytest.approx(base.annual_rate + 0.014, abs=1e-4)
    assert [c.bps for c in other.components[1:]] == [c.bps for c in base.components[1:]]
    floor = price(BY_KEY["treasury_deposit"], s, 0.0, reference_rate=0.0)
    assert floor.annual_rate == 0.0


def test_deposit_is_a_yield_below_the_reference_rate():
    p = price(BY_KEY["treasury_deposit"], snapshot(raw={"cash_days": 400.0}), 0.0)
    assert p.kind == "yield" and 0 < p.annual_rate < cfg.EURIBOR_12M
    assert any(c.key == "estabilidad" for c in p.components)


# --- risk scorecard ---------------------------------------------------------


def test_risk_model_contributions_sum_to_the_logit_and_more_liquidity_means_less_risk():
    m = model()
    x = snapshot_features(snapshot())
    out = m.explain(x)
    logit = m.intercept + sum(c["logit"] for c in out["contributions"])
    assert out["p_stress_6m"] == pytest.approx(1 / (1 + np.exp(-logit)), abs=1e-3)
    better = snapshot_features(snapshot(pillars={**PILLARS_OK, "liquidez": 90.0}))
    assert m.probability(better) < m.probability(x)


def test_fit_zeroes_features_whose_sign_says_healthier_is_riskier():
    rng = np.random.default_rng(0)
    n = 2000
    x = rng.normal(size=(n, len(FEATURES)))
    # column 2 pushes the wrong way (healthier -> riskier) and must be zeroed
    y = (x[:, 0] - 0.5 * x[:, 2] + rng.normal(size=n) < -0.3).astype(int)
    m = RiskModel().fit(x, y, groups=np.arange(n) % 10)
    assert m.coef[0] < 0 and m.coef[2] == 0.0
    assert 0.5 < m.evaluation["oof_auroc"] <= 1.0


def test_levers_report_a_premium_saving_for_weak_pillars_only():
    s = snapshot(pillars={"liquidez": 20.0, "deuda": 70.0, "pago": 10.0, "cobro": None})
    lv = levers(model(), BY_KEY["credit_line"], s)
    assert [x.pillar for x in lv] == [
        "liquidez"
    ]  # pago has no coefficient, cobro unknown
    assert lv[0].p_stress_then < lv[0].p_stress_now and lv[0].premium_saving_bps > 0
    assert levers(model(), BY_KEY["treasury_deposit"], s) == []


# --- engine -------------------------------------------------------------------


def test_engine_payload_is_ranked_explained_and_lists_the_rest():
    payload = Recommender(model()).recommend(snapshot())
    offers = payload["recommendations"]
    assert offers and offers[0]["product"] == "credit_line"
    assert [o["rank"] for o in offers] == list(range(1, len(offers) + 1))
    top = offers[0]
    assert top["headline"].startswith("Línea de crédito de")
    assert top["why"] and top["pricing"]["story"] and top["sizing"]["formula"]
    assert {d["product"] for d in payload["declined"]} | {
        o["product"] for o in offers
    } == set(RULES)
    assert payload["risk"]["p_stress_6m"] == pytest.approx(
        model().probability(snapshot_features(snapshot())), abs=1e-4
    )
    assert "levers" in payload["improvement_plan"]


def test_engine_reprices_for_a_requested_reference_rate():
    rec = Recommender(model())
    s = snapshot()
    default = rec.recommend(s)
    custom = rec.recommend(s, reference_rate=0.04)
    assert default["reference_rate"]["source"] == "default"
    assert custom["reference_rate"] == {
        "label": cfg.REFERENCE_RATE_LABEL,
        "value": 0.04,
        "source": "request",
    }
    top_default, top_custom = (
        default["recommendations"][0],
        custom["recommendations"][0],
    )
    assert top_custom["spread_bps"] == top_default["spread_bps"]
    assert top_custom["annual_rate"] == pytest.approx(
        top_default["annual_rate"] + (0.04 - cfg.EURIBOR_12M), abs=1e-4
    )
    assert "4.00%" in top_custom["pricing"]["story"][-1]


def test_snapshot_round_trips_through_json():
    import json

    s = snapshot(holdings=Holdings(types=("loan",), loan_outstanding=1.0))
    again = CompanySnapshot.from_dict(json.loads(json.dumps(s.to_dict())))
    assert again.pulse == s.pulse and again.holdings.loan_outstanding == 1.0
    assert again.variables["cash_days"].raw == 12.0 and again.holdings.has("loan")


def test_engine_explains_a_company_with_no_offer():
    payload = Recommender(model()).recommend(snapshot(pulse=10.0, pulse_raw=20.0))
    assert payload["recommendations"] == []
    assert "no hay hoy un producto" in payload["summary"]
    assert any("Línea de crédito" in u for u in payload["improvement_plan"]["unlocks"])
