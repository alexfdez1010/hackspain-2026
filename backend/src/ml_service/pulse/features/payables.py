"""Pillar pago: #5 DPO real y su Δ3m, #6 plazo concedido por proveedores y su Δ6m."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.features.months import delta, rolling_weighted_mean


def payables_features(inv: pl.DataFrame, grid: pl.DataFrame) -> pl.DataFrame:
    """Add ``dpo_days``, ``dpo_d3``, ``terms_days``, ``terms_d6`` to the grid.

    DPO is measured on settled supplier invoices, by the month the payment
    happened, value-weighted, over a trailing quarter. Terms are measured on
    supplier invoices by issuance month, value-weighted, over a trailing half year.
    """
    ap = inv.filter(pl.col("side") == "ap")
    paid = ap.filter(pl.col("payment_date").is_not_null()).with_columns(
        (pl.col("payment_date") - pl.col("issuance_date"))
        .dt.total_days()
        .cast(pl.Float64)
        .alias("days"),
        pl.col("payment_date").dt.truncate("1mo").alias("month"),
    )
    dpo = paid.group_by("company_id", "month").agg(
        (pl.col("days") * pl.col("amount_eur")).sum().alias("dpo_num"),
        pl.col("amount_eur").sum().alias("dpo_den"),
    )
    issued = ap.filter(pl.col("due_date").is_not_null()).with_columns(
        (pl.col("due_date") - pl.col("issuance_date"))
        .dt.total_days()
        .cast(pl.Float64)
        .alias("days"),
        pl.col("issuance_date").dt.truncate("1mo").alias("month"),
    )
    terms = issued.group_by("company_id", "month").agg(
        (pl.col("days") * pl.col("amount_eur")).sum().alias("terms_num"),
        pl.col("amount_eur").sum().alias("terms_den"),
    )
    panel = (
        grid.join(dpo, on=["company_id", "month"], how="left")
        .join(terms, on=["company_id", "month"], how="left")
        .sort("company_id", "month")
        .with_columns(
            rolling_weighted_mean("dpo_num", "dpo_den", 3).alias("dpo_days"),
            rolling_weighted_mean("terms_num", "terms_den", 6).alias("terms_days"),
        )
        .with_columns(
            delta("dpo_days", 3).alias("dpo_d3"),
            delta("terms_days", 6).alias("terms_d6"),
        )
    )
    return panel.drop("dpo_num", "dpo_den", "terms_num", "terms_den")
