"""Rules for the invoice-backed products: factoring (customers) and confirming (suppliers)."""

from __future__ import annotations

from ml_service.pulse.recommend import config as cfg
from ml_service.pulse.recommend.rules_common import (
    Assessment,
    already_holds,
    block,
    cash_days_reason,
    contra,
    days,
    eur,
    pct,
    pro,
    pulse_gate,
    trend_reason,
)
from ml_service.pulse.recommend.snapshot import CompanySnapshot


def factoring(s: CompanySnapshot) -> Assessment:
    """Advance receivables when collection is slow but the book is reasonably current."""
    a = Assessment("factoring")
    inv = s.invoices
    if not inv.has_erp or inv.eligible_ar < cfg.MIN_ELIGIBLE_AR_EUR:
        return a.add(
            block(
                "sin_facturas",
                f"No vemos facturas de clientes suficientes ({eur(inv.eligible_ar)} cobrables); el factoring necesita tu ERP conectado.",
            )
        )
    a.add(already_holds(s, "factoring", "una línea de factoring"))
    a.add(pulse_gate(s, cfg.MIN_PULSE_FACTORING))
    ar90 = s.raw("ar90")
    if ar90 is not None and ar90 > cfg.FACTORING_MAX_AR90:
        a.add(
            block(
                "cartera_vencida",
                f"El {pct(ar90)} de tu cartera lleva más de 90 días vencida (máximo {pct(cfg.FACTORING_MAX_AR90)}): ningún factor anticipa esas facturas.",
            )
        )
    elif ar90 is not None and ar90 > 0.25:
        a.add(
            contra(
                "cartera_algo_vencida",
                f"El {pct(ar90)} de la cartera supera los 90 días: el anticipo será menor.",
                10,
                variable="ar90",
                value=ar90,
                unit="% de la cartera",
            )
        )
    dso = s.raw("dso")
    if dso is not None and dso > cfg.LONG_DSO_DAYS:
        a.add(
            pro(
                "cobro_lento",
                f"Tardas {days(dso)} en cobrar a tus clientes (umbral {cfg.LONG_DSO_DAYS:.0f}).",
                25,
                variable="dso",
                value=dso,
                unit="días",
            )
        )
    elif dso is not None and dso < 25:
        a.add(
            contra(
                "cobro_rapido",
                f"Ya cobras en {days(dso)}: anticipar facturas aporta poco.",
                15,
                variable="dso",
                value=dso,
                unit="días",
            )
        )
    a.add(cash_days_reason(s, low_points=20, high_points=-15))
    if inv.eligible_ar >= 2 * s.monthly_outflow:
        a.add(
            pro(
                "cartera_amplia",
                f"Tienes {eur(inv.eligible_ar)} en facturas cobrables, más de dos meses de pagos.",
                15,
                value=inv.eligible_ar,
                unit="EUR",
            )
        )
    top = s.raw("top_client")
    if top is not None and top >= 0:
        a.add(
            pro(
                "cliente_top_estable",
                f"Tu principal cliente mantiene o aumenta su facturación ({top:+.0%}).",
                5,
                variable="top_client",
                value=top,
                unit="% vs trimestre anterior",
            )
        )
    return a.add(trend_reason(s, when_declining=5, when_improving=0))
