"""The 11 PULSE variables: pillar, weight (% of the score), components and directions."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Component:
    """One measurable series feeding a variable (level or delta)."""

    name: str
    direction: int  # +1 higher is healthier, -1 otherwise
    zero_is_best: bool = (
        False  # an exact 0 is the theoretical optimum (e.g. nothing falls due)
    )


@dataclass(frozen=True)
class Variable:
    """One of the 11 PULSE variables with its weight (% of the score)."""

    key: str
    number: int
    label_es: str
    pillar: str
    weight: float
    components: tuple[Component, ...]


VARIABLES: tuple[Variable, ...] = (
    Variable(
        "cash_days", 1, "Días de caja", "liquidez", 12, (Component("cash_days", 1),)
    ),
    Variable(
        "cash_min",
        2,
        "Mínimo intramensual de caja",
        "liquidez",
        14,
        (Component("cash_min_ratio", 1),),
    ),
    Variable(
        "loc_util",
        3,
        "Utilización de líneas",
        "deuda",
        12,
        (Component("loc_util", -1), Component("loc_util_d3", -1)),
    ),
    Variable(
        "loc_accel",
        4,
        "Aceleración de utilización",
        "deuda",
        6,
        (Component("loc_accel", -1),),
    ),
    Variable(
        "dpo",
        5,
        "DPO real y su variación",
        "pago",
        6,
        (Component("dpo_days", -1), Component("dpo_d3", -1)),
    ),
    Variable(
        "terms",
        6,
        "Plazo concedido por proveedores",
        "pago",
        6,
        (Component("terms_days", 1), Component("terms_d6", 1)),
    ),
    Variable("dso", 7, "DSO real", "cobro", 6, (Component("dso_days", -1),)),
    Variable(
        "ar90",
        8,
        "Tramo +90 días",
        "cobro",
        12,
        (Component("ar90_share", -1), Component("ar90_d3", -1)),
    ),
    Variable(
        "top_client",
        9,
        "Caída del cliente top",
        "cobro",
        8,
        (Component("top_client_growth", 1),),
    ),
    Variable(
        "maturities",
        10,
        "Vencimientos 6 m sobre caja",
        "deuda",
        8,
        (Component("maturities_ratio", -1, zero_is_best=True),),
    ),
    Variable(
        "network",
        12,
        "Exposición a contrapartes",
        "cobro",
        10,
        (Component("network_exposure", 1),),
    ),
)
PILLARS = ("liquidez", "deuda", "pago", "cobro")
assert abs(sum(v.weight for v in VARIABLES) - 100) < 1e-9
