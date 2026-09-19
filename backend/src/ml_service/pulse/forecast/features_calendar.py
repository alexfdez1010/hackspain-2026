"""Invoice-calendar features: what is already due to be collected or paid in the next months."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.features.receivables import open_receivables_by_month

KEY = ["company_id", "month"]
DUE_HORIZONS = (1, 3, 6)


def calendar_features(inv: pl.DataFrame) -> pl.DataFrame:
    """Per company-month: open AR/AP falling due within 1/3/6 months and open amounts already past due."""
    opened = open_receivables_by_month(inv.filter(pl.col("due_date").is_not_null()))
    month_end = pl.col("month").dt.offset_by("1mo")
    aggs = [
        pl.when(
            pl.col("due_date").is_between(month_end, month_end.dt.offset_by(f"{h}mo"))
        )
        .then(pl.col("amount_eur"))
        .otherwise(0.0)
        .sum()
        .alias(f"due_{h}m")
        for h in DUE_HORIZONS
    ]
    aggs.append(
        pl.when(pl.col("due_date") < month_end)
        .then(pl.col("amount_eur"))
        .otherwise(0.0)
        .sum()
        .alias("overdue_open")
    )
    by_side = opened.group_by(KEY + ["side"]).agg(aggs)
    return by_side.pivot(
        on="side",
        index=KEY,
        values=[f"due_{h}m" for h in DUE_HORIZONS] + ["overdue_open"],
    )


def calendar_columns() -> list[str]:
    return [f"due_{h}m_{s}" for h in DUE_HORIZONS for s in ("ar", "ap")] + [
        "overdue_open_ar",
        "overdue_open_ap",
    ]


def calendar_ratios(df: pl.DataFrame) -> pl.DataFrame:
    """Scale the calendar amounts by the company's monthly burn so they are comparable across sizes."""
    burn = pl.max_horizontal(pl.col("outflow_3m") / 3.0, 1.0)
    exprs = [
        ((pl.col(f"due_{h}m_ar") - pl.col(f"due_{h}m_ap")) / burn).alias(f"wc_due_{h}m")
        for h in DUE_HORIZONS
    ]
    exprs += [
        (pl.col(f"due_{h}m_ap") / burn).alias(f"ap_due_{h}m") for h in DUE_HORIZONS
    ]
    exprs.append((pl.col("overdue_open_ap") / burn).alias("ap_overdue_ratio"))
    return df.with_columns(exprs)
