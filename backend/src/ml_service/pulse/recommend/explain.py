"""Plain-Spanish narrative for one recommendation: what, why, how priced, what would improve it."""

from __future__ import annotations

from ml_service.pulse.recommend.catalogue import Product
from ml_service.pulse.recommend.levers import Lever
from ml_service.pulse.recommend.pricing import Pricing
from ml_service.pulse.recommend.rules_common import Assessment, eur
from ml_service.pulse.recommend.sizing import Sizing
from ml_service.pulse.recommend.snapshot import CompanySnapshot


def _rate(p: Pricing) -> str:
    return f"{p.annual_rate:.2%}"


def headline(product: Product, sizing: Sizing, pricing: Pricing) -> str:
    verb = "remunerado al" if pricing.kind == "yield" else "a un tipo del"
    tenor = f" a {sizing.tenor_months} meses" if sizing.tenor_months else ""
    return f"{product.label_es} de {eur(sizing.amount)}{tenor}, {verb} {_rate(pricing)} anual."


def why(assessment: Assessment) -> list[str]:
    """The arguments in favour, strongest first, then the caveats."""
    pros = sorted(
        (r for r in assessment.reasons if r.kind == "pro"), key=lambda r: -r.points
    )
    cons = [r for r in assessment.reasons if r.kind == "contra"]
    return [r.text for r in pros] + [f"A tener en cuenta: {r.text}" for r in cons]


def price_story(product: Product, pricing: Pricing, s: CompanySnapshot) -> list[str]:
    lines = [f"{c.label}: {c.bps:+d} pb. {c.detail}" for c in pricing.components]
    raw_spread = sum(c.bps for c in pricing.components if c.key != "referencia")
    if pricing.clamped:
        lines.append(
            f"El diferencial sale a {raw_spread:+d} pb, fuera de la banda del producto ({product.min_spread_bps:+d} a {product.max_spread_bps:+d} pb sobre el tipo sin riesgo), así que aplicamos el límite: {pricing.spread_bps:+d} pb."
        )
    lines.append(
        f"Total: {pricing.reference_rate:.2%} de referencia {pricing.spread_bps:+d} pb = {_rate(pricing)} anual."
    )
    current = s.holdings.current_rate
    if pricing.kind == "cost" and current is not None and product.family == "plazo":
        diff = (pricing.annual_rate - current) * 10_000
        comparison = "por encima" if diff > 0 else "por debajo"
        lines.append(
            f"Tus préstamos actuales están al {current:.2%}: el nuevo tipo queda {abs(diff):.0f} pb {comparison}."
        )
    return lines


def lever_story(levers: list[Lever]) -> list[str]:
    out = []
    for lv in levers:
        vars_txt = ", ".join(
            f"{v['label'].lower()} ({v['score']:.0f}/100)" for v in lv.variables[:2]
        )
        detail = f" Las variables que más pesan: {vars_txt}." if vars_txt else ""
        out.append(
            f"Si tu pilar de {lv.label.removeprefix('Pilar ').lower()} subiera de {lv.current:.0f} a {lv.target:.0f}, la probabilidad de tensión pasaría del {lv.p_stress_now:.0%} al {lv.p_stress_then:.0%} y la prima de riesgo bajaría {lv.premium_saving_bps} pb.{detail}"
        )
    return out


def declined_story(
    assessments: list[Assessment], products: dict[str, Product]
) -> list[dict]:
    """Why each non-recommended product was left out, in the company's terms."""
    out = []
    for a in assessments:
        blockers = [r.text for r in a.reasons if r.kind == "bloqueo"]
        if blockers:
            out.append(
                {
                    "product": a.product,
                    "label": products[a.product].label_es,
                    "status": "no_elegible",
                    "reasons": blockers,
                }
            )
        else:
            cons = [r.text for r in a.reasons if r.kind == "contra"]
            out.append(
                {
                    "product": a.product,
                    "label": products[a.product].label_es,
                    "status": "poco_encaje",
                    "fit": round(a.fit, 1),
                    "reasons": cons
                    or ["No hay una necesidad clara que este producto resuelva hoy."],
                }
            )
    return out


def unlocks(
    s: CompanySnapshot, assessments: list[Assessment], products: dict[str, Product]
) -> list[str]:
    """Products blocked only by the PULSE minimum, and how far the company is from it."""
    out = []
    for a in assessments:
        blockers = [r for r in a.reasons if r.kind == "bloqueo"]
        gates = [r for r in blockers if r.code in ("pulse_bajo", "tension_extrema")]
        if not gates or len(blockers) != len(gates):
            continue
        needed = gates[0].text.split("mínimo de ")[1].split(" ")[0]
        out.append(
            f"{products[a.product].label_es}: se desbloquea con un PULSE de {needed} (hoy {s.pulse:.0f})."
        )
    return out


def portfolio_summary(s: CompanySnapshot, n_recommended: int) -> str:
    if n_recommended == 0:
        return f"Con un PULSE de {s.pulse:.0f} y una cobertura de datos del {s.confidence:.0%} no hay hoy un producto que encaje; abajo detallamos qué haría falta para que lo hubiera."
    return f"PULSE {s.pulse:.0f} ({s.month}), cobertura de datos {s.confidence:.0%}: {n_recommended} producto(s) encajan con tu situación."
