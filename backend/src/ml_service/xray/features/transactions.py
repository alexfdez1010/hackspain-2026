"""Monthly features derived from bank transactions and reconstructed balances."""

from __future__ import annotations

from datetime import timedelta

import polars as pl

from ml_service.xray.config import (
    CASH_ACCOUNT_TYPES,
    EXTRACTION_DATE,
    INTERCOMPANY_REGEX,
    STRESS_REGEX,
)
from ml_service.xray.io import Dataset

MONTH = pl.col("date").dt.truncate("1mo").alias("month")
UNANCHORED_ACTIVE_FROM = EXTRACTION_DATE - timedelta(days=62)


def _booked(ds: Dataset) -> pl.DataFrame:
    """Booked transactions joined with product type and final balance."""
    tx = ds.table("transactions").filter(
        pl.col("status").fill_null("booked") != "pending"
    )
    types = ds.product_types()
    bal = ds.table("balances").select(
        "product_id", pl.col("balance").alias("final_balance")
    )
    return tx.join(types, on="product_id", how="left").join(
        bal, on="product_id", how="left"
    )


def reconstruct_balances(tx: pl.DataFrame) -> pl.DataFrame:
    """Rebuild month-end and intra-month balances per product from the final snapshot.

    balance_end(m) = final_balance - sum(amount for months after m). Accounts whose
    snapshot is missing, or exactly zero while still active, are treated as
    unanchored: their series is shifted so the lowest daily balance is zero (a
    conservative "no overdraft" floor) instead of trusting the snapshot.
    """
    daily = (
        tx.with_columns(pl.col("date").dt.date().alias("day"))
        .group_by("product_id", "company_id", "type", "day")
        .agg(pl.col("amount").sum().alias("net"), pl.col("final_balance").first())
        .sort("product_id", "day")
    )
    last_day = pl.col("day").max().over("product_id")
    unanchored = pl.col("final_balance").is_null() | (
        (pl.col("final_balance") == 0)
        & (last_day >= pl.lit(UNANCHORED_ACTIVE_FROM.date()))
    )
    daily = daily.with_columns(
        (
            pl.col("final_balance").fill_null(0.0)
            - pl.col("net").cum_sum(reverse=True).over("product_id")
            + pl.col("net")
        ).alias("balance"),
        unanchored.alias("unanchored"),
    )
    floor = pl.col("balance").min().over("product_id")
    daily = daily.with_columns(
        pl.when(pl.col("unanchored"))
        .then(pl.col("balance") - floor)
        .otherwise(pl.col("balance"))
        .alias("balance")
    ).with_columns(pl.col("day").cast(pl.Datetime).dt.truncate("1mo").alias("month"))
    return (
        daily.group_by("product_id", "company_id", "type", "month")
        .agg(
            pl.col("balance").last().alias("balance_end"),
            pl.col("balance").min().alias("balance_min"),
            (pl.col("balance") < 0).mean().alias("neg_day_share"),
        )
        .sort("product_id", "month")
    )


def cash_features(balances: pl.DataFrame) -> pl.DataFrame:
    """Company-month cash position aggregated over cash-like accounts."""
    cash = balances.filter(pl.col("type").is_in(CASH_ACCOUNT_TYPES))
    return cash.group_by("company_id", "month").agg(
        pl.col("balance_end").sum().alias("cash_end"),
        pl.col("balance_min").sum().alias("cash_min"),
        pl.col("neg_day_share").mean().alias("neg_balance_share"),
        pl.col("product_id").n_unique().alias("n_cash_accounts"),
    )


def loc_features(balances: pl.DataFrame, ds: Dataset) -> pl.DataFrame:
    """Company-month line-of-credit drawn amount and utilisation."""
    limits = ds.table("debt_products").select(
        "product_id", pl.col("granted").abs().alias("limit")
    )
    loc = balances.filter(pl.col("type") == "lineofcredit").join(
        limits, on="product_id", how="left"
    )
    loc = loc.with_columns((-pl.col("balance_end")).clip(lower_bound=0).alias("drawn"))
    return loc.group_by("company_id", "month").agg(
        pl.col("drawn").sum().alias("loc_drawn"),
        pl.col("limit").fill_null(0).sum().alias("loc_limit"),
    )


def flow_features(tx: pl.DataFrame) -> pl.DataFrame:
    """Company-month operating flows, category flows, stress events and activity."""
    cash = tx.filter(
        pl.col("type").is_in(CASH_ACCOUNT_TYPES) | pl.col("type").is_null()
    )
    inter = pl.col("description").fill_null("").str.contains(INTERCOMPANY_REGEX)
    ops = (~inter) & (pl.col("category").fill_null("-") != "transfer")
    amt = pl.col("amount")
    desc = pl.col("description").fill_null("")
    cat = pl.col("category").fill_null("-")
    aggs = [
        amt.filter(ops & (amt > 0)).sum().alias("inflow"),
        (-amt.filter(ops & (amt < 0)).sum()).alias("outflow"),
        amt.filter(
            cat.is_in(
                ["collection", "bulk_collection", "pos_settlement", "cash_settlement"]
            )
        )
        .sum()
        .alias("collections"),
        (-amt.filter(cat.is_in(["tax", "social_security"])).sum()).alias("tax_paid"),
        (-amt.filter(cat == "salary").sum()).alias("payroll"),
        (-amt.filter(cat == "debt_repayment").sum()).alias("debt_repaid"),
        (-amt.filter(cat.is_in(["interest_charge", "fee"]) & (amt < 0)).sum()).alias(
            "financing_cost"
        ),
        amt.filter(~inter & (cat == "transfer") & (amt > 0))
        .sum()
        .alias("financing_inflow"),
        pl.len().alias("n_tx"),
        (amt.filter(ops & (amt > 0)).len()).alias("n_inflows"),
        pl.col("counterparty_id").n_unique().alias("n_counterparties"),
        (cat == "-").mean().alias("uncategorised_share"),
    ]
    for name, rx in STRESS_REGEX.items():
        hit = desc.str.contains(rx)
        aggs.append(hit.sum().alias(f"{name}_n"))
        aggs.append(amt.filter(hit).abs().sum().alias(f"{name}_amt"))
    return cash.with_columns(MONTH).group_by("company_id", "month").agg(aggs)


def build_transaction_features(ds: Dataset) -> pl.DataFrame:
    """Join flows, cash and line-of-credit features into one company-month frame."""
    tx = _booked(ds)
    balances = reconstruct_balances(tx)
    out = flow_features(tx)
    out = out.join(
        cash_features(balances), on=["company_id", "month"], how="full", coalesce=True
    )
    out = out.join(
        loc_features(balances, ds),
        on=["company_id", "month"],
        how="full",
        coalesce=True,
    )
    return out.sort("company_id", "month")
