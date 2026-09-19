"""Spanish narrative of one signal: what moved, how much, and what it turned out to be."""

from __future__ import annotations

from datetime import datetime

from ml_service.pulse.signals.config import (
    BASELINE_MONTHS,
    FOLLOW_UP_MONTHS,
    PERSISTENT_THRESHOLD,
    PILLAR_MOVE,
)
from ml_service.pulse.variables import PILLARS

MONTHS_ES = (
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
)  # fmt: skip
PILLAR_ES = {
    "liquidez": "liquidez",
    "deuda": "deuda y servicio",
    "cobro": "calidad de cobro",
    "pago": "comportamiento de pago",
}
KIND = {
    (-1, True): "caida",
    (-1, False): "bache",
    (1, True): "mejora",
    (1, False): "repunte",
}
KIND_ES = {"caida": "Caída", "bache": "Bache", "mejora": "Mejora", "repunte": "Repunte"}
OUTCOME_ES = {
    (
        -1,
        True,
    ): f"{FOLLOW_UP_MONTHS} meses después seguía por debajo: caída confirmada.",
    (
        -1,
        False,
    ): f"Volvió a su nivel en menos de {FOLLOW_UP_MONTHS} meses: fue un bache.",
    (
        1,
        True,
    ): f"{FOLLOW_UP_MONTHS} meses después seguía por encima: mejora confirmada.",
    (
        1,
        False,
    ): f"Volvió a su nivel en menos de {FOLLOW_UP_MONTHS} meses: fue un repunte.",
}


def month_es(month: datetime) -> str:
    """«marzo de 2026»."""
    return f"{MONTHS_ES[month.month - 1]} de {month.year}"


def kind_of(direction: int, p_persistent: float | None) -> str:
    """Name of the episode from its direction and its persistence probability."""
    persistent = p_persistent is not None and p_persistent >= PERSISTENT_THRESHOLD
    return KIND[(int(direction), persistent)]


def drivers(row: dict) -> list[dict]:
    """Pillars that moved with the score, largest move first."""
    direction = int(row["direction"])
    moved = [
        {
            "pillar": p,
            "label": PILLAR_ES[p],
            "delta": round(float(row[f"delta_{p}"]), 1),
        }
        for p in PILLARS
        if float(row[f"delta_{p}"]) * direction > PILLAR_MOVE
    ]
    return sorted(moved, key=lambda d: -abs(d["delta"]))


def headline(row: dict, kind: str) -> str:
    """«Caída de 12 puntos en marzo de 2026»."""
    return f"{KIND_ES[kind]} de {abs(round(float(row['move'])))} puntos en {month_es(row['month'])}"


def detail(row: dict, kind: str, moved: list[dict]) -> str:
    """One sentence with the move, its drivers and the probability or the outcome."""
    verb = "bajó" if int(row["direction"]) < 0 else "subió"
    level, base = round(float(row["level"])), round(float(row["baseline"]))
    text = (
        f"PULSE {verb} de {base} a {level} frente a la media de los "
        f"{BASELINE_MONTHS} meses anteriores"
    )
    if moved:
        parts = ", ".join(f"{d['label']} ({d['delta']:+.0f})" for d in moved)
        text += f"; se movieron {parts}"
    text += "."
    persistent = row.get("persistent")
    p = row.get("p_persistent")
    if persistent is not None:
        return f"{text} {OUTCOME_ES[(int(row['direction']), bool(persistent))]}"
    if p is not None:
        what = "estructural" if int(row["direction"]) < 0 else "duradera"
        return f"{text} Probabilidad de que sea {what}: {round(float(p) * 100)} %."
    return text
