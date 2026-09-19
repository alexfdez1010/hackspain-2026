"""Rules for the liquidity products: new credit line, line increase and treasury deposit."""

from __future__ import annotations

from ml_service.pulse.recommend import config as cfg
from ml_service.pulse.recommend.rules_common import (
    Assessment,
    block,
    cash_days_reason,
    confidence_gate,
    contra,
    days,
    eur,
    pct,
    pro,
    pulse_gate,
    trend_reason,
)
from ml_service.pulse.recommend.snapshot import CompanySnapshot


def _cash_min_reason(s: CompanySnapshot, points: float):
    ratio = s.raw("cash_min")
    if ratio is None or ratio >= cfg.LOW_CASH_MIN_RATIO:
        return None
    return pro(
        "minimo_intramensual",
        f"En el peor día del mes tu caja baja a {ratio:.2f} meses de salidas (umbral {cfg.LOW_CASH_MIN_RATIO}).",
        points,
        variable="cash_min",
        value=ratio,
        unit="x salidas mensuales",
    )


def credit_line(s: CompanySnapshot) -> Assessment:
    """A new working-capital line for companies whose cash runs thin inside the month."""
    a = Assessment("credit_line")
    a.add(confidence_gate(s)).add(pulse_gate(s, cfg.MIN_PULSE_NEW_CREDIT))
    if s.monthly_outflow < cfg.MIN_OUTFLOW_EUR:
        a.add(
            block(
                "actividad_baja",
                f"Tus pagos mensuales ({eur(s.monthly_outflow)}) son demasiado bajos para dimensionar una línea.",
            )
        )
    h = s.holdings
    if h.line_limit > 0 and h.line_available >= 0.5 * h.line_limit:
        a.add(
            block(
                "linea_disponible",
                f"Ya tienes una línea con {eur(h.line_available)} sin disponer de {eur(h.line_limit)}.",
            )
        )
    cd = s.raw("cash_days")
    if cd is not None and cd > cfg.EXCESS_CASH_DAYS:
        a.add(
            block(
                "sin_necesidad",
                f"Tu caja cubre {days(cd)} de pagos: no necesitas una línea.",
            )
        )
    a.add(cash_days_reason(s, low_points=25, high_points=-20))
    a.add(_cash_min_reason(s, 20))
    if h.line_limit == 0:
        a.add(
            pro(
                "sin_linea",
                "No tienes ninguna póliza de crédito: cualquier bache lo absorbe la caja.",
                10,
            )
        )
    if s.pulse >= 50:
        a.add(
            pro(
                "pulse_solido",
                f"Tu PULSE de {s.pulse:.0f} está en la mitad sana de la cartera.",
                10,
                value=s.pulse,
                unit="PULSE",
            )
        )
    elif s.pulse < 40:
        a.add(
            contra(
                "pulse_justo",
                f"Tu PULSE de {s.pulse:.0f} está por debajo de 40: el límite será prudente.",
                10,
                value=s.pulse,
                unit="PULSE",
            )
        )
    return a.add(trend_reason(s, when_declining=10, when_improving=0))


def credit_line_increase(s: CompanySnapshot) -> Assessment:
    """Raise the limit of an existing line that is drawn close to the top."""
    a = Assessment("credit_line_increase")
    h = s.holdings
    if h.line_limit <= 0:
        return a.add(
            block("sin_linea", "No tienes ninguna línea de crédito que ampliar.")
        )
    a.add(confidence_gate(s)).add(pulse_gate(s, cfg.MIN_PULSE_NEW_CREDIT))
    util = s.raw("loc_util")
    if util is not None and util < cfg.UTIL_HIGH:
        a.add(
            block(
                "utilizacion_baja",
                f"Usas el {pct(util)} de tu límite: por debajo del {pct(cfg.UTIL_HIGH)} no hace falta ampliar.",
            )
        )
    elif util is not None:
        a.add(
            pro(
                "linea_al_tope",
                f"Tu línea está dispuesta al {pct(util)} de {eur(h.line_limit)}.",
                30,
                variable="loc_util",
                value=util,
                unit="% del límite",
            )
        )
    accel = s.raw("loc_accel")
    if accel is not None and accel > 0.1:
        a.add(
            pro(
                "uso_acelera",
                f"La utilización de la línea se acelera ({accel:+.2f} puntos en tres meses).",
                15,
                variable="loc_accel",
                value=accel,
                unit="pts",
            )
        )
    a.add(cash_days_reason(s, low_points=15, high_points=-10))
    if s.pulse >= 50:
        a.add(
            pro(
                "pulse_solido",
                f"Tu PULSE de {s.pulse:.0f} respalda una ampliación.",
                10,
                value=s.pulse,
                unit="PULSE",
            )
        )
    elif s.pulse < 40:
        a.add(
            contra(
                "linea_por_caida",
                f"Con un PULSE de {s.pulse:.0f}, la línea está creciendo porque la caja cae; ampliar solo pospone el problema.",
                15,
                value=s.pulse,
                unit="PULSE",
            )
        )
    return a.add(trend_reason(s, when_declining=5, when_improving=5))
