"""Recommender: rules -> sizing -> pricing -> levers -> narrative, for one company snapshot."""

from __future__ import annotations

from dataclasses import asdict, dataclass

from ml_service.pulse.recommend import config as cfg
from ml_service.pulse.recommend import explain
from ml_service.pulse.recommend.catalogue import BY_KEY, Product
from ml_service.pulse.recommend.levers import levers
from ml_service.pulse.recommend.pricing import price
from ml_service.pulse.recommend.risk import RiskModel, snapshot_features
from ml_service.pulse.recommend.rules import assess_all
from ml_service.pulse.recommend.rules_common import Assessment
from ml_service.pulse.recommend.sizing import annuity, size
from ml_service.pulse.recommend.snapshot import CompanySnapshot

GENERIC_PRODUCT = "credit_line"
"""Product whose LGD prices the company-level improvement plan."""
DISCLAIMER = (
    "Propuesta orientativa calculada a partir de tus datos bancarios y de ERP conectados a Embat. "
    "Los tipos son indicativos sobre el Euríbor 12 m de referencia y quedan sujetos a la aprobación de la entidad."
)


@dataclass
class Recommender:
    """Turns a snapshot into a ranked, explained list of product offers."""

    model: RiskModel

    def _offer(
        self,
        a: Assessment,
        s: CompanySnapshot,
        p6: float,
        rank: int,
        reference_rate: float,
    ) -> dict:
        product: Product = BY_KEY[a.product]
        sizing = size(a.product, s)
        pricing = price(product, s, p6, reference_rate)
        lvs = levers(self.model, product, s)
        instalment = (
            annuity(sizing.amount, pricing.annual_rate, sizing.tenor_months)
            if product.family == "plazo" and sizing.tenor_months
            else None
        )
        return {
            "rank": rank,
            "product": product.key,
            "label": product.label_es,
            "family": product.family,
            "what": product.what_es,
            "fit": round(a.fit, 1),
            "amount": sizing.amount,
            "tenor_months": sizing.tenor_months,
            "monthly_instalment": round(instalment, 2) if instalment else None,
            "rate_kind": pricing.kind,
            "annual_rate": pricing.annual_rate,
            "spread_bps": pricing.spread_bps,
            "headline": explain.headline(product, sizing, pricing),
            "why": explain.why(a),
            "reasons": [asdict(r) for r in a.reasons],
            "sizing": {"formula": sizing.formula, "inputs": sizing.inputs},
            "pricing": {
                "components": [asdict(c) for c in pricing.components],
                "clamped": pricing.clamped,
                "reference_rate": pricing.reference_rate,
                "spread_band_bps": [product.min_spread_bps, product.max_spread_bps],
                "annual_pd": pricing.annual_pd,
                "expected_loss_bps": pricing.expected_loss_bps,
                "story": explain.price_story(product, pricing, s),
            },
            "levers": [asdict(lv) for lv in lvs],
            "lever_story": explain.lever_story(lvs),
        }

    def recommend(
        self, s: CompanySnapshot, reference_rate: float | None = None
    ) -> dict:
        """Full explainable payload for one company, priced over ``reference_rate``.

        ``None`` uses the configured Euríbor; the API passes the caller's value.
        """
        reference = cfg.EURIBOR_12M if reference_rate is None else reference_rate
        risk = self.model.explain(snapshot_features(s))
        p6 = risk["p_stress_6m"]
        assessments = assess_all(s)
        ranked = sorted(
            (
                a
                for a in assessments
                if a.eligible and a.fit >= cfg.MIN_FIT_TO_RECOMMEND
            ),
            key=lambda a: -a.fit,
        )[: cfg.MAX_RECOMMENDATIONS]
        offers = [self._offer(a, s, p6, i + 1, reference) for i, a in enumerate(ranked)]
        offers = [o for o in offers if o["amount"] > 0]
        chosen = {o["product"] for o in offers}
        declined = explain.declined_story(
            [a for a in assessments if a.product not in chosen], BY_KEY
        )
        plan = levers(self.model, BY_KEY[GENERIC_PRODUCT], s)
        return {
            "company_id": s.company_id,
            "month": s.month,
            "pulse": s.pulse,
            "confidence": s.confidence,
            "pillars": s.pillars,
            "reference_rate": {
                "label": cfg.REFERENCE_RATE_LABEL,
                "value": round(reference, 6),
                "source": "request" if reference_rate is not None else "default",
            },
            "summary": explain.portfolio_summary(s, len(offers)),
            "risk": risk,
            "recommendations": offers,
            "declined": declined,
            "improvement_plan": {
                "unlocks": explain.unlocks(s, assessments, BY_KEY),
                "levers": [asdict(lv) for lv in plan],
                "story": explain.lever_story(plan),
            },
            "inputs": {
                "cash_end": s.cash_end,
                "monthly_outflow": round(s.monthly_outflow, 2),
                "monthly_collections": round(s.monthly_collections, 2),
                "service_3m": round(s.service_3m, 2),
                "pulse_d3": s.pulse_d3,
                "holdings": asdict(s.holdings),
                "invoices": asdict(s.invoices),
                "outlook": asdict(s.outlook),
                "variables": {k: asdict(v) for k, v in s.variables.items()},
            },
            "disclaimer": DISCLAIMER,
        }


def summary_row(payload: dict) -> dict:
    """Compact portfolio row derived from a full payload."""
    top = payload["recommendations"][0] if payload["recommendations"] else None
    return {
        "company_id": payload["company_id"],
        "month": payload["month"],
        "pulse": payload["pulse"],
        "confidence": payload["confidence"],
        "p_stress_6m": payload["risk"]["p_stress_6m"],
        "n_recommended": len(payload["recommendations"]),
        "top_product": top["product"] if top else None,
        "top_label": top["label"] if top else None,
        "top_amount": top["amount"] if top else None,
        "top_annual_rate": top["annual_rate"] if top else None,
        "top_spread_bps": top["spread_bps"] if top else None,
        "top_rate_kind": top["rate_kind"] if top else None,
        "top_fit": top["fit"] if top else None,
        "headline": top["headline"] if top else payload["summary"],
    }
