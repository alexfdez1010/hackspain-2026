"""Company-level debt structure features (static snapshot at extraction)."""

from __future__ import annotations

import polars as pl

from ml_service.xray.io import Dataset


def build_debt_features(ds: Dataset) -> pl.DataFrame:
    """Aggregate outstanding, granted and loan-term facts per company.

    Signs in the raw file are inconsistent (liabilities are often negative), so
    absolute values are used throughout.
    """
    dp = ds.table("debt_products")
    if not dp.height:
        return pl.DataFrame(schema={"company_id": pl.String})
    out = dp.group_by("company_id").agg(
        pl.col("outstanding").abs().sum().alias("debt_outstanding"),
        pl.col("granted").abs().sum().alias("debt_granted"),
        pl.col("product_id").n_unique().alias("n_debt_products"),
        (pl.col("type") == "lineofcredit").sum().alias("n_loc"),
        (pl.col("service") == "custom").sum().alias("n_custom_debt"),
        pl.col("type").n_unique().alias("n_debt_types"),
    )
    sched = ds.table("debt_schedule_config")
    if sched.height:
        terms = sched.group_by("company_id").agg(
            pl.col("annual_interest_rate_or_spread").mean().alias("avg_interest_rate"),
            (pl.col("interest_type") == "variable").mean().alias("variable_rate_share"),
        )
        out = out.join(terms, on="company_id", how="left")
    return out
