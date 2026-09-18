"""Transparent pillar sub-scores and their weighted composite (0-100)."""

from __future__ import annotations

import polars as pl

from ml_service.xray.config import FEATURE_SPECS, PILLARS

PILLAR_WEIGHTS: dict[str, float] = {
    "liquidity": 0.26,
    "cashflow": 0.20,
    "payments": 0.20,
    "receivables": 0.14,
    "debt": 0.12,
    "activity": 0.08,
}
# Features that carry more evidence get a higher weight inside their pillar.
FEATURE_WEIGHTS: dict[str, float] = {
    "neg_balance_share": 2.0,
    "cash_runway_months": 1.5,
    "min_balance_ratio": 1.5,
    "payables_overdue_share": 2.0,
    "returned_debit_rate": 1.5,
    "loc_utilization": 2.0,
    "receivables_overdue_share": 1.5,
    "net_positive_share_6m": 1.5,
}


def pillar_scores(normed: pl.DataFrame) -> pl.DataFrame:
    """Add ``pillar_<name>`` columns (0-100) as weighted means of known features."""
    exprs = []
    for pillar in PILLARS:
        specs = [s for s in FEATURE_SPECS if s.pillar == pillar]
        num = sum(
            pl.col(f"{s.name}__norm") * pl.col(f"{s.name}__known").cast(pl.Float64) * FEATURE_WEIGHTS.get(s.name, 1.0)
            for s in specs
        )
        den = sum(pl.col(f"{s.name}__known").cast(pl.Float64) * FEATURE_WEIGHTS.get(s.name, 1.0) for s in specs)
        exprs.append(pl.when(den > 0).then(num / den * 100).otherwise(None).alias(f"pillar_{pillar}"))
        exprs.append((den > 0).alias(f"pillar_{pillar}__known"))
    return normed.with_columns(exprs)


def composite_score(scored: pl.DataFrame) -> pl.DataFrame:
    """Add ``composite`` (0-100): pillar-weighted mean over pillars with data."""
    num = sum(
        pl.col(f"pillar_{p}").fill_null(0.0) * pl.col(f"pillar_{p}__known").cast(pl.Float64) * w
        for p, w in PILLAR_WEIGHTS.items()
    )
    den = sum(pl.col(f"pillar_{p}__known").cast(pl.Float64) * w for p, w in PILLAR_WEIGHTS.items())
    return scored.with_columns((num / den).alias("composite"))
