"""Unit tests for the evaluation metrics, stability block and report rendering."""

from __future__ import annotations

import json
from datetime import datetime

import numpy as np
import polars as pl
import pytest

from ml_service.xray.backtest import split_panel
from ml_service.xray.evaluate import format_markdown
from ml_service.xray.metrics import (
    auroc,
    calibration_table,
    change_metrics,
    pr_auc,
    prediction_report,
    spearman,
)
from ml_service.xray.stability import (
    direction_flips,
    monthly_psi,
    psi,
    score_churn,
    stability_report,
)

MONTHS = [datetime(2025, m, 1) for m in range(1, 13)]


def test_auroc_of_a_perfect_ranking_is_one():
    """A score that separates the classes perfectly gets AUROC 1."""
    y = np.array([0, 0, 1, 1])
    assert auroc(y, np.array([0.1, 0.2, 0.8, 0.9])) == 1.0
    assert auroc(y, np.array([0.9, 0.8, 0.2, 0.1])) == 0.0
    assert pr_auc(y, np.array([0.1, 0.2, 0.8, 0.9])) == 1.0


def test_metrics_are_nan_safe():
    """Degenerate inputs return NaN instead of raising."""
    assert np.isnan(auroc(np.array([1, 1]), np.array([0.5, 0.6])))
    assert np.isnan(spearman(np.array([1.0, np.nan]), np.array([np.nan, 2.0])))
    assert calibration_table(np.array([]), np.array([])) == []


def test_spearman_ignores_missing_pairs():
    """Rank correlation only uses rows where both sides are observed."""
    a = np.array([1.0, 2.0, 3.0, np.nan])
    b = np.array([10.0, 20.0, 30.0, 40.0])
    assert spearman(a, b) == pytest.approx(1.0)


def test_calibration_table_bins_and_sums_to_the_sample():
    """The decile table covers every row exactly once."""
    rng = np.random.default_rng(0)
    p = rng.uniform(size=500)
    y = (rng.uniform(size=500) < p).astype(int)
    table = calibration_table(p, y)
    assert len(table) == 10
    assert sum(r["n"] for r in table) == 500
    assert table[0]["p_mean"] < table[-1]["p_mean"]


def test_change_metrics_report_both_directions():
    """Improvers and decliners get their own recall."""
    real = np.array([10.0, 12.0, -10.0, -15.0, 1.0])
    pred = np.array([8.0, -2.0, -9.0, -20.0, 0.5])
    out = change_metrics(pred, real)
    assert out["n_improvers"] == 2
    assert out["n_decliners"] == 2
    assert out["improver_recall"] == pytest.approx(0.5)
    assert out["decliner_recall"] == pytest.approx(1.0)
    assert out["sign_agreement"] == pytest.approx(0.8)


def test_change_metrics_on_empty_input():
    """No usable rows means no metrics, not a crash."""
    assert change_metrics(np.array([]), np.array([])) == {"n": 0}


def _oof(n: int = 40) -> pl.DataFrame:
    rng = np.random.default_rng(1)
    base = rng.uniform(30, 70, n)
    y = (base < 50).astype(int)
    return pl.DataFrame(
        {
            "company_id": [f"C{i % 8}" for i in range(n)],
            "month": [MONTHS[i % 12] for i in range(n)],
            "y_stress": y,
            "p_stress": 1 - (base - 30) / 40,
            "composite": base,
            "pred_future_composite": base + 2,
            "y_future_composite": base + rng.normal(2, 1, n),
        }
    )


def test_prediction_report_has_every_block():
    """The report carries discrimination, rank, change and calibration blocks."""
    report = prediction_report(_oof())
    assert report["n_rows"] == 40
    assert report["n_companies"] == 8
    assert report["auroc_stress"] == pytest.approx(1.0)
    assert report["spearman_future_composite"] > 0.9
    assert report["change_6m"]["n"] == 40
    assert len(report["calibration"]) == 10


def test_psi_is_zero_for_identical_distributions():
    """A distribution compared with itself has no drift."""
    values = np.linspace(0, 100, 200)
    edges = np.array([-np.inf, 25.0, 50.0, 75.0, np.inf])
    assert psi(values, values, edges) == pytest.approx(0.0)
    assert psi(values, values[values < 50], edges) > 0.3


def _scored(n_months: int = 12) -> pl.DataFrame:
    rows = []
    for c in range(4):
        for i in range(n_months):
            rows.append(
                {
                    "company_id": f"C{c}",
                    "month": MONTHS[i],
                    "score": 50.0 + c + (i if c == 0 else 0),
                    "direction": "improving" if (c == 1 and i % 2) else "stable",
                }
            )
    return pl.DataFrame(rows)


def test_monthly_psi_returns_one_row_per_transition():
    """PSI is reported for every month after the first."""
    series = monthly_psi(_scored())
    assert len(series) == 11
    assert series[0]["month"] == "2025-02"


def test_score_churn_measures_absolute_movement():
    """Only one company moves, by one point a month."""
    churn = score_churn(_scored())
    assert churn["max_abs_delta"] == pytest.approx(1.0)
    assert churn["mean_abs_delta"] == pytest.approx(0.25)


def test_direction_flips_counts_unstable_companies():
    """The alternating company is the only one over the flip threshold."""
    flips = direction_flips(_scored())
    assert flips["n_companies"] == 4
    assert flips["share_over_3_flips"] == pytest.approx(0.25)


def test_stability_report_bundles_everything():
    """The stability block exposes the keys the report renderer needs."""
    report = stability_report(_scored())
    assert {"psi_mean", "psi_max", "mean_abs_delta", "direction_flips"} <= set(report)


def test_split_panel_respects_the_cutoff():
    """Nothing after the cutoff leaks into the training window."""
    panel = pl.DataFrame({"month": MONTHS, "company_id": ["C1"] * 12})
    train, test = split_panel(panel, datetime(2025, 8, 1))
    assert train.height == 8
    assert test["month"].min() == datetime(2025, 9, 1)


def test_format_markdown_renders_both_splits(tmp_path):
    """The markdown summary mentions both splits and the calibration table."""
    report = {
        "meta": {},
        "cv": prediction_report(_oof()),
        "backtest": prediction_report(_oof()),
        "stability": stability_report(_scored()),
    }
    text = format_markdown(report)
    assert "group CV" in text and "temporal backtest" in text
    assert "Calibration" in text and "PSI" in text
    (tmp_path / "evaluation.json").write_text(json.dumps(report))
    assert json.loads((tmp_path / "evaluation.json").read_text())["cv"]["n_rows"] == 40
