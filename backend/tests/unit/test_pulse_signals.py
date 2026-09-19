"""Unit tests for PULSE Señales: detection, persistence model, narrative and export."""

from datetime import datetime

import numpy as np
import polars as pl

from ml_service.pulse.signals.detect import detect_all, detect_company
from ml_service.pulse.signals.explain import detail, headline, kind_of
from ml_service.pulse.signals.export import signal_payload
from ml_service.pulse.signals.model import PersistenceModel

PILLARS = ("liquidez", "deuda", "pago", "cobro")


def _history(
    pulse: list[float], pillars: list[list[float]] | None = None, company="C1"
) -> pl.DataFrame:
    """A scored history where every pillar follows the score unless given."""
    n = len(pulse)
    months = [
        datetime(2025, 1 + i % 12, 1) if i < 12 else datetime(2026, i - 11, 1)
        for i in range(n)
    ]
    cols = {
        "company_id": [company] * n,
        "month": months,
        "pulse": pulse,
        "confidence": [0.8] * n,
    }
    for j, p in enumerate(PILLARS):
        cols[f"pillar_{p}"] = pillars[j] if pillars else pulse
    return pl.DataFrame(cols)


def test_a_persistent_fall_opens_one_signal_labelled_persistent():
    pulse = [60, 60, 60, 60, 48, 45, 44, 43, 42]
    signals = detect_company(_history(pulse))
    assert len(signals) == 1
    s = signals[0]
    assert s["direction"] == -1
    assert s["month"] == datetime(2025, 5, 1)
    assert s["move"] == -12
    assert s["breadth"] == 4
    assert s["persistent"] is True


def test_a_dip_that_recovers_is_transitory_and_a_recent_one_is_open():
    pulse = [60, 60, 60, 60, 50, 59, 60, 60, 60, 60, 60, 60, 48]
    signals = detect_company(_history(pulse))
    assert [s["persistent"] for s in signals] == [False, None]
    assert [s["direction"] for s in signals] == [-1, -1]


def test_one_pillar_alone_does_not_fire():
    pulse = [60, 60, 60, 60, 50, 50, 50]
    flat = [[60] * 7] * 3
    only_liquidity = [[60, 60, 60, 60, 20, 20, 20], *flat]
    assert detect_company(_history(pulse, only_liquidity)) == []


def test_a_rise_fires_upwards_and_detect_all_keeps_the_schema():
    pulse = [40, 40, 40, 40, 55, 56, 57, 58]
    df = detect_all(_history(pulse))
    assert df.height == 1
    assert df["direction"][0] == 1
    assert df["persistent"][0] is True
    assert "delta_liquidez" in df.columns


def test_persistence_model_fits_scores_and_round_trips(tmp_path):
    rng = np.random.default_rng(0)
    n = 300
    rows = []
    for i in range(n):
        direction = -1 if i % 2 == 0 else 1
        breadth = int(rng.integers(2, 5))
        persistent = bool(breadth >= 4 or rng.random() < 0.3)
        rows.append(
            {
                "company_id": f"C{i % 40}",
                "month": datetime(2025, 1, 1),
                "direction": direction,
                "level": float(rng.uniform(20, 80)),
                "baseline": 50.0,
                "move": float(direction * rng.uniform(6, 20)),
                "breadth": breadth,
                "confidence": float(rng.uniform(0.3, 1)),
                "volatility": float(rng.uniform(0, 8)),
                **{
                    f"delta_{p}": float(direction * rng.uniform(0, 20)) for p in PILLARS
                },
                "persistent": persistent,
            }
        )
    signals = pl.DataFrame(rows)
    model = PersistenceModel.fit(signals)
    assert model.down.evaluation["oof_auroc"] > 0.6
    scored = model.score(signals)
    assert scored["p_persistent"].is_between(0, 1).all()
    model.save(tmp_path / "signals.json")
    again = PersistenceModel.load(tmp_path / "signals.json")
    assert (
        again.score(signals)["p_persistent"].to_list()
        == scored["p_persistent"].to_list()
    )
    assert model.score(signals.head(0))["p_persistent"].is_null().all()


def _row(direction=-1, persistent=None, p=0.7):
    return {
        "company_id": "C1",
        "month": datetime(2026, 3, 1),
        "direction": direction,
        "level": 46.4,
        "baseline": 58.1,
        "move": -11.7 * direction * -1 if direction == -1 else 11.7,
        "breadth": 2,
        "confidence": 0.8,
        "volatility": 3.0,
        "delta_liquidez": -14.0 * (-direction),
        "delta_deuda": -9.0 * (-direction),
        "delta_pago": 1.0,
        "delta_cobro": 0.0,
        "persistent": persistent,
        "p_persistent": p,
    }


def test_kind_and_texts_follow_direction_probability_and_outcome():
    assert kind_of(-1, 0.7) == "caida"
    assert kind_of(-1, 0.3) == "bache"
    assert kind_of(1, 0.7) == "mejora"
    assert kind_of(1, None) == "repunte"
    row = _row()
    assert headline(row, "caida") == "Caída de 12 puntos en marzo de 2026"
    text = detail(row, "caida", [{"label": "liquidez", "delta": -14.0}])
    assert "bajó de 58 a 46" in text
    assert "liquidez (-14)" in text
    assert "estructural: 70 %" in text
    assert "caída confirmada" in detail(_row(persistent=True), "caida", [])
    assert "fue un bache" in detail(_row(persistent=False), "bache", [])


def test_signal_payload_is_the_web_contract():
    payload = signal_payload(_row(persistent=True))
    assert payload["month"] == "2026-03"
    assert payload["kind"] == "caida"
    assert payload["direction"] == "down"
    assert payload["outcome"] == "persistente"
    assert payload["drivers"][0]["pillar"] == "liquidez"
    assert payload["pillar_deltas"]["liquidez"] == -14.0
    assert signal_payload(_row())["outcome"] is None
