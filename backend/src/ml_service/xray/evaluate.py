"""Honest evaluation of the X-Ray engine: group CV, temporal backtest, stability."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import polars as pl

from ml_service.xray.backtest import CUTOFF, temporal_backtest
from ml_service.xray.config import FEATURES_DIR, MODELS_DIR, OUTPUT_DIR
from ml_service.xray.metrics import prediction_report
from ml_service.xray.stability import stability_report

PANEL_PATH = FEATURES_DIR / "panel.parquet"
OOF_PATH = OUTPUT_DIR / "oof.parquet"
SCORED_PATH = OUTPUT_DIR / "scored_panel.parquet"
REPORT_PATH = OUTPUT_DIR / "evaluation.json"


def load_oof(
    oof_path: Path = OOF_PATH, panel: pl.DataFrame | None = None
) -> pl.DataFrame:
    """Load cached group-wise out-of-fold predictions, refitting them if absent."""
    if oof_path.exists():
        return pl.read_parquet(oof_path)
    if panel is None:
        raise FileNotFoundError(f"{oof_path} is missing and no panel was given")
    from ml_service.xray.score.pipeline import ScoreEngine

    oof = ScoreEngine.fit(panel, cross_validate=True).models.oof
    if oof is None:
        raise RuntimeError("cross_validate did not produce out-of-fold predictions")
    return oof


def load_scored(
    scored_path: Path = SCORED_PATH, panel: pl.DataFrame | None = None
) -> pl.DataFrame:
    """Load the scored panel, scoring it with the saved engine if absent."""
    if scored_path.exists():
        return pl.read_parquet(scored_path)
    if panel is None:
        raise FileNotFoundError(f"{scored_path} is missing and no panel was given")
    from ml_service.xray.score.pipeline import ScoreEngine

    return ScoreEngine.load(MODELS_DIR).score(panel)


def evaluate_all(
    panel_path: Path = PANEL_PATH,
    oof_path: Path = OOF_PATH,
    scored_path: Path = SCORED_PATH,
    cutoff: datetime = CUTOFF,
    out_path: Path | None = REPORT_PATH,
) -> dict:
    """Run every evaluation block and persist the report as JSON.

    Args:
        panel_path: Feature panel written by ``build_panel``.
        oof_path: Cached group-wise out-of-fold predictions.
        scored_path: Cached scored panel used for the stability block.
        cutoff: Last month the temporal backtest may train on.
        out_path: Where to write the JSON report (``None`` to skip writing).

    Returns:
        Nested report with ``cv``, ``backtest``, ``stability`` and ``meta``.
    """
    panel = pl.read_parquet(panel_path)
    oof = load_oof(oof_path, panel)
    scored = load_scored(scored_path, panel)
    report = {
        "meta": {
            "generated_at": datetime.now().isoformat(timespec="seconds"),
            "panel_rows": int(panel.height),
            "companies": int(panel["company_id"].n_unique()),
            "months": [str(panel["month"].min())[:7], str(panel["month"].max())[:7]],
        },
        "cv": prediction_report(oof),
        "backtest": temporal_backtest(panel, cutoff),
        "stability": stability_report(scored),
    }
    if out_path is not None:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(report, indent=2))
    return report


def _row(name: str, block: dict) -> str:
    change = block.get("change_6m", {})
    cells = [
        name,
        str(block.get("n_rows", "-")),
        f"{block.get('stress_rate', float('nan')):.3f}",
        f"{block.get('auroc_stress', float('nan')):.3f}",
        f"{block.get('pr_auc_stress', float('nan')):.3f}",
        f"{block.get('spearman_future_composite', float('nan')):.3f}",
        f"{change.get('spearman', float('nan')):.3f}",
        f"{change.get('sign_agreement', float('nan')):.3f}",
        f"{change.get('improver_recall', float('nan')):.3f}",
        f"{change.get('decliner_recall', float('nan')):.3f}",
    ]
    return "| " + " | ".join(cells) + " |"


def format_markdown(report: dict) -> str:
    """Render the report as a compact markdown summary."""
    head = (
        "| split | rows | stress rate | AUROC | PR-AUC | rho(future) | "
        "rho(change) | sign agr. | improver rec. | decliner rec. |"
    )
    lines = [head, "|" + "---|" * 10]
    lines.append(_row("group CV", report["cv"]))
    lines.append(_row("temporal backtest", report["backtest"]))
    stab = report["stability"]
    lines += [
        "",
        f"PSI month-over-month: mean {stab['psi_mean']:.4f}, max {stab['psi_max']:.4f}",
        (
            f"Absolute score change: mean {stab['mean_abs_delta']:.2f} pts, "
            f"p95 {stab['p95_abs_delta']:.2f} pts"
        ),
        (
            "Companies flipping direction more than 3x in 12 months: "
            f"{stab['direction_flips']['share_over_3_flips']:.1%}"
        ),
        "",
        "Calibration (group CV, deciles of p_stress):",
        "| decile | n | mean p | realised |",
        "|---|---|---|---|",
    ]
    for row in report["cv"]["calibration"]:
        lines.append(
            f"| {row['bin']} | {row['n']} | {row['p_mean']:.3f} | {row['realised']:.3f} |"
        )
    return "\n".join(lines)
