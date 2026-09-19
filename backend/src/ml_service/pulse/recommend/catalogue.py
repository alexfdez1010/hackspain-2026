"""The financial products the advisor can recommend and their pricing parameters.

The catalogue mirrors the facilities the portfolio already uses (loan, line of
credit, confirming, factoring in ``debt_products.csv``) plus a treasury deposit
for companies sitting on excess cash. Everything is priced as a spread over the risk-free
reference rate (Euríbor 12 m), so the same recommendation can be re-quoted for
any reference: ``base_spread_bps`` is the margin for a company with zero
expected loss, ``lgd`` the loss given default that turns the stress probability
into a risk premium, and ``min/max_spread_bps`` the band the total spread is
clamped to.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Family = Literal["circulante", "cobros", "pagos", "plazo", "tesoreria"]
RateKind = Literal["cost", "yield"]


@dataclass(frozen=True)
class Product:
    """One product of the catalogue with the parameters the pricing quotes."""

    key: str
    label_es: str
    family: Family
    what_es: str
    """One sentence a finance manager understands: what the product does."""
    rate_kind: RateKind
    base_spread_bps: int
    lgd: float
    min_spread_bps: int
    max_spread_bps: int
    tenor_months: int | None = None
    dataset_type: str | None = None
    """Matching ``type`` in ``debt_products.csv`` (None for the deposit)."""


PRODUCTS: tuple[Product, ...] = (
    Product(
        "credit_line",
        "Línea de crédito",
        "circulante",
        "Póliza de la que dispones solo cuando la caja lo necesita; pagas intereses únicamente por lo dispuesto.",
        "cost",
        base_spread_bps=150,
        lgd=0.45,
        min_spread_bps=40,
        max_spread_bps=990,
        tenor_months=12,
        dataset_type="lineofcredit",
    ),
    Product(
        "credit_line_increase",
        "Ampliación de línea de crédito",
        "circulante",
        "Subida del límite de tu póliza actual para que deje de ir al tope cada mes.",
        "cost",
        base_spread_bps=125,
        lgd=0.45,
        min_spread_bps=40,
        max_spread_bps=990,
        tenor_months=12,
        dataset_type="lineofcredit",
    ),
    Product(
        "factoring",
        "Anticipo de facturas (factoring)",
        "cobros",
        "Cobras hoy las facturas que tus clientes te pagarán en 30-90 días; el riesgo se apoya en la calidad de esos clientes.",
        "cost",
        base_spread_bps=100,
        lgd=0.20,
        min_spread_bps=0,
        max_spread_bps=790,
        tenor_months=12,
        dataset_type="factoring",
    ),
    Product(
        "confirming",
        "Confirming de proveedores",
        "pagos",
        "El banco paga a tus proveedores en la fecha pactada y tú liquidas más tarde; alarga tu plazo de pago sin tensar la relación.",
        "cost",
        base_spread_bps=90,
        lgd=0.30,
        min_spread_bps=0,
        max_spread_bps=690,
        tenor_months=12,
        dataset_type="confirming",
    ),
    Product(
        "term_loan",
        "Préstamo a plazo",
        "plazo",
        "Importe fijo con cuota mensual constante a varios años, para inversión o para dar aire a la caja.",
        "cost",
        base_spread_bps=175,
        lgd=0.40,
        min_spread_bps=90,
        max_spread_bps=890,
        tenor_months=48,
        dataset_type="loan",
    ),
    Product(
        "refinancing",
        "Reestructuración de vencimientos",
        "plazo",
        "Agrupa la deuda que vence en los próximos meses en un único préstamo más largo, con una cuota que tu caja pueda pagar.",
        "cost",
        base_spread_bps=200,
        lgd=0.45,
        min_spread_bps=140,
        max_spread_bps=1090,
        tenor_months=60,
        dataset_type="loan",
    ),
    Product(
        "treasury_deposit",
        "Depósito de excedentes de tesorería",
        "tesoreria",
        "Remunera la caja que no vas a necesitar en los próximos meses sin renunciar a disponer de ella al vencimiento.",
        "yield",
        base_spread_bps=-60,
        lgd=0.0,
        min_spread_bps=-100,
        max_spread_bps=0,
        tenor_months=6,
        dataset_type=None,
    ),
)
BY_KEY: dict[str, Product] = {p.key: p for p in PRODUCTS}


def product(key: str) -> Product:
    """Return the catalogue entry for ``key``; raises ``KeyError`` when unknown."""
    return BY_KEY[key]
