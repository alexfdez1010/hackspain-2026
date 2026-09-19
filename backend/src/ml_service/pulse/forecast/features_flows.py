"""Transaction-derived forecast features: flows, events, intragroup share, activity."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.config import CASH_TYPES, INTERCOMPANY_REGEX
from ml_service.pulse.forecast.config import RETURNED_DEBIT_REGEX, STRESS_EVENT_REGEX

KEY = ["company_id", "month"]
FLOW_COLUMNS = (
    "inflow",
    "inflow_intra",
    "ev_returned",
    "ev_stress",
    "n_tx",
    "n_accounts",
)


def monthly_flows(tx: pl.DataFrame) -> pl.DataFrame:
    """Per company-month on cash accounts: inflows, intragroup inflows, stress narratives, activity."""
    cash = tx.filter(pl.col("product_type").is_in(CASH_TYPES)).with_columns(
        pl.col("date").dt.truncate("1mo").alias("month")
    )
    positive = pl.col("amount_eur") > 0
    intra = pl.col("description").str.contains(INTERCOMPANY_REGEX).fill_null(False)
    return cash.group_by(KEY).agg(
        pl.col("amount_eur").filter(positive).sum().alias("inflow"),
        pl.col("amount_eur").filter(positive & intra).sum().alias("inflow_intra"),
        pl.col("description")
        .str.contains(RETURNED_DEBIT_REGEX)
        .fill_null(False)
        .sum()
        .alias("ev_returned"),
        pl.col("description")
        .str.contains(STRESS_EVENT_REGEX)
        .fill_null(False)
        .sum()
        .alias("ev_stress"),
        pl.len().alias("n_tx"),
        pl.col("product_id").n_unique().alias("n_accounts"),
    )


def flow_dynamics(df: pl.DataFrame) -> pl.DataFrame:
    """Rolling flow ratios on the dense panel (expects ``outflow``/``outflow_3m`` from the cash features)."""
    burn = pl.max_horizontal(pl.col("outflow_3m") / 3.0, 1.0)
    rolling = lambda c, w: (
        pl.col(c).fill_null(0.0).rolling_sum(w, min_samples=1).over("company_id")
    )
    df = df.with_columns(
        rolling("inflow", 3).alias("inflow_3m"),
        rolling("inflow", 6).alias("inflow_6m"),
        rolling("outflow", 6).alias("outflow_6m"),
        rolling("ev_returned", 3).alias("ev_returned_3m"),
        rolling("ev_stress", 3).alias("ev_stress_3m"),
        (pl.col("inflow_intra") / pl.max_horizontal(pl.col("inflow"), 1.0)).alias(
            "intra_share"
        ),
        pl.col("month").dt.month().alias("month_of_year"),
    )
    return df.with_columns(
        ((pl.col("inflow_3m") - pl.col("outflow_3m")) / burn).alias("net_3m_ratio"),
        ((pl.col("inflow_6m") - pl.col("outflow_6m")) / burn).alias("net_6m_ratio"),
        (
            pl.col("inflow_3m")
            / pl.max_horizontal(pl.col("inflow_3m").shift(3).over("company_id"), 1.0)
        )
        .log()
        .alias("inflow_growth_3m"),
        (pl.col("service_3m") * 2 / burn).alias("debt_service_ratio"),
        (1 - pl.col("loc_util")).alias("loc_headroom"),
        pl.col("dpo_days").is_not_null().alias("has_erp"),
        (pl.col("cash_end").shift(12).over("company_id") / burn).alias(
            "cash_same_month_last_year"
        ),
    )
