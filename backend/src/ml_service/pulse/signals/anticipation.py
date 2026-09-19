"""How many months ahead does PULSE see cash stress? Measured, not asserted.

For every company-month with no stress in the last ``CLEAN_MONTHS`` months,
the label at horizon ``k`` is «at least one stress month in the next k». The
score is read as it stood that month, so the curve says how well today's
number ranks the stress that arrives one to six months later. The alert row
flags the ``ALERT_SHARE`` lowest scores and reports how many of the coming
episodes that catches, against the base rate.
"""

from __future__ import annotations

import numpy as np
import polars as pl
from sklearn.metrics import roc_auc_score

from ml_service.pulse.evaluate import stress_label
from ml_service.pulse.signals.config import ALERT_SHARE, CLEAN_MONTHS, MAX_HORIZON


def _clean_rows(scored: pl.DataFrame, tx: pl.DataFrame) -> pl.DataFrame:
    """Rows with a score and no stress in the last ``CLEAN_MONTHS`` months, with future labels."""
    df = stress_label(scored, tx).sort("company_id", "month")
    past = pl.sum_horizontal(
        [pl.col("stress_now").shift(k).over("company_id") for k in range(CLEAN_MONTHS)]
    )
    labels = [
        pl.sum_horizontal(
            [pl.col("stress_now").shift(-j).over("company_id") for j in range(1, k + 1)]
        )
        .ge(1)
        .cast(pl.Int32)
        .alias(f"y{k}")
        for k in range(1, MAX_HORIZON + 1)
    ]
    reach = [
        pl.col("month").shift(-k).over("company_id").is_not_null().alias(f"has{k}")
        for k in range(1, MAX_HORIZON + 1)
    ]
    return df.with_columns(past.alias("past_stress"), *labels, *reach).filter(
        (pl.col("past_stress") == 0) & pl.col("pulse").is_not_null()
    )


def _horizon(df: pl.DataFrame, k: int) -> dict | None:
    rows = df.filter(pl.col(f"has{k}"))
    y = rows[f"y{k}"].to_numpy()
    score = rows["pulse"].to_numpy().astype(float)
    if len(y) < 100 or len(set(y)) < 2:
        return None
    cut = np.quantile(score, ALERT_SHARE)
    alert = score <= cut
    base = float(y.mean())
    precision = float(y[alert].mean()) if alert.any() else 0.0
    return {
        "rows": len(y),
        "base_rate": round(base, 4),
        "auroc": round(float(roc_auc_score(y, -score)), 4),
        "alert_share": ALERT_SHARE,
        "alert_cut": round(float(cut), 2),
        "recall": round(float(y[alert].sum() / max(1, y.sum())), 4),
        "precision": round(precision, 4),
        "lift": round(precision / base, 2) if base > 0 else None,
    }


def anticipation_curve(scored: pl.DataFrame, tx: pl.DataFrame) -> dict:
    """AUROC, recall and lift of PULSE for stress arriving one to six months later."""
    df = _clean_rows(scored, tx)
    return {
        "clean_rows": int(df.height),
        "alert_share": ALERT_SHARE,
        "horizons": {
            str(k): result
            for k in range(1, MAX_HORIZON + 1)
            if (result := _horizon(df, k)) is not None
        },
    }
