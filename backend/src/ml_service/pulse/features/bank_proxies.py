"""Bank-side proxies for the invoice variables of the *cobro* pillar (#8, #9, #12).

A company without ERP has no invoices, so DSO, the +90 bucket, the top customer
and the counterparty network are unknown. Its bank statements still show who
pays it (``counterparty_ref``), how much, and which collections bounce. These
three proxies are computed for **every** company and used by the score only
when the invoice-based components are missing, at a reduced confidence.

* ``returned_share``      returned collections / collections, trailing 3m (proxy of #8)
* ``top_client_growth_bank``  #9 recomputed on attributed bank collections
* ``network_exposure_bank``   #12 recomputed on what the company's payers pay
  to *other* companies of the portfolio (a payer seen in only one company
  carries no network information and is skipped)

Each proxy of #9 and #12 comes with a coverage column: the share of collection
value that could be attributed to a counterparty over its window. The score
scales the proxy's confidence by that coverage.
"""

from __future__ import annotations

import polars as pl

from ml_service.pulse.config import (
    CASH_TYPES,
    COLLECTION_CATEGORIES,
    RETURNED_COLLECTION_CATEGORIES,
)
from ml_service.pulse.features.months import (
    delta,
    month_from_index,
    month_index,
    rolling_sum,
)
from ml_service.pulse.features.receivables import TOP_WINDOW, top_client_growth

NETWORK_WINDOW = 6
MIN_COMPANIES_BANK = 2  # a payer must be seen in >= 2 companies to be a network signal
MOMENTUM_CLIP = 1.0
KEY = ["company_id", "month"]


def bank_collections(tx: pl.DataFrame) -> pl.DataFrame:
    """Cash-account inflows in the collection categories, with the resolved payer (may be null)."""
    return tx.filter(
        pl.col("product_type").is_in(CASH_TYPES)
        & (pl.col("amount_eur") > 0)
        & pl.col("category").is_in(COLLECTION_CATEGORIES)
    ).select(
        "company_id",
        "counterparty_ref",
        pl.col("date").dt.truncate("1mo").alias("month"),
        "amount_eur",
    )


def _monthly_totals(coll: pl.DataFrame, tx: pl.DataFrame) -> pl.DataFrame:
    """Per (company, month): collected, collected_attributed, returned."""
    totals = coll.group_by(KEY).agg(
        pl.col("amount_eur").sum().alias("collected"),
        pl.when(pl.col("counterparty_ref").is_not_null())
        .then(pl.col("amount_eur"))
        .otherwise(0.0)
        .sum()
        .alias("collected_attributed"),
    )
    returned = (
        tx.filter(
            pl.col("product_type").is_in(CASH_TYPES)
            & (pl.col("amount_eur") < 0)
            & pl.col("category").is_in(RETURNED_COLLECTION_CATEGORIES)
        )
        .group_by("company_id", pl.col("date").dt.truncate("1mo").alias("month"))
        .agg((-pl.col("amount_eur")).sum().alias("returned"))
    )
    return totals.join(returned, on=KEY, how="full", coalesce=True)


def _returned_share(panel: pl.DataFrame) -> pl.DataFrame:
    """``returned_share`` (3m, value-weighted) and ``returned_d3``; null when nothing was collected."""
    ret = rolling_sum("returned", 3)
    col = rolling_sum("collected", 3)
    return panel.with_columns(
        pl.when(col > 0).then(ret / col).otherwise(None).alias("returned_share")
    ).with_columns(delta("returned_share", 3).alias("returned_d3"))


def _network_exposure_bank(
    attributed: pl.DataFrame, grid: pl.DataFrame
) -> pl.DataFrame:
    """Σ over payers of (share of the company's 6m collections) × (3m momentum of what that payer pays *others*)."""
    grid_months = grid.select(month_index("month").alias("_mi")).unique()
    by_pair = attributed.group_by(
        "company_id", "counterparty_ref", month_index("month").alias("_mi")
    ).agg(pl.col("amount_eur").sum().alias("paid"))
    n_companies = by_pair.group_by("counterparty_ref").agg(
        pl.col("company_id").n_unique().alias("n_companies")
    )
    shared = n_companies.filter(pl.col("n_companies") >= MIN_COMPANIES_BANK)
    by_pair = by_pair.join(shared.select("counterparty_ref"), on="counterparty_ref")
    if by_pair.is_empty():
        return grid.select(KEY).with_columns(
            pl.lit(None, dtype=pl.Float64).alias("network_exposure_bank"),
            pl.lit(None, dtype=pl.Int64).alias("network_payers_bank"),
            pl.lit(None, dtype=pl.Float64).alias("_net_attributed_6m"),
        )
    pool = (
        by_pair.select("counterparty_ref")
        .unique()
        .join(grid_months, how="cross")
        .join(
            by_pair.group_by("counterparty_ref", "_mi").agg(
                pl.col("paid").sum().alias("pool")
            ),
            on=["counterparty_ref", "_mi"],
            how="left",
        )
        .sort("counterparty_ref", "_mi")
        .with_columns(
            rolling_sum("pool", NETWORK_WINDOW, by="counterparty_ref").alias("pool6")
        )
        .select("counterparty_ref", "_mi", "pool6")
    )
    pairs = (
        grid.select("company_id", month_index("month").alias("_mi"))
        .join(
            by_pair.select("company_id", "counterparty_ref").unique(), on="company_id"
        )
        .join(by_pair, on=["company_id", "counterparty_ref", "_mi"], how="left")
        .sort("company_id", "counterparty_ref", "_mi")
        .with_columns(
            rolling_sum(
                "paid", NETWORK_WINDOW, by=("company_id", "counterparty_ref")
            ).alias("own6")
        )
        .join(pool, on=["counterparty_ref", "_mi"], how="left")
        .with_columns((pl.col("pool6") - pl.col("own6")).alias("others6"))
        .with_columns(
            pl.col("others6")
            .shift(3)
            .over("company_id", "counterparty_ref")
            .alias("others6_prev")
        )
    )
    momentum = (
        pl.when(pl.col("others6_prev").is_null() | (pl.col("others6_prev") <= 0))
        .then(None)
        .otherwise(
            (
                (pl.col("others6") - pl.col("others6_prev")) / pl.col("others6_prev")
            ).clip(-MOMENTUM_CLIP, MOMENTUM_CLIP)
        )
    )
    pairs = pairs.with_columns(momentum.alias("momentum")).filter(
        (pl.col("own6") > 0) & pl.col("momentum").is_not_null()
    )
    exposure = (
        pairs.group_by("company_id", "_mi")
        .agg(
            ((pl.col("own6") * pl.col("momentum")).sum() / pl.col("own6").sum()).alias(
                "network_exposure_bank"
            ),
            pl.col("counterparty_ref").n_unique().alias("network_payers_bank"),
            pl.col("own6").sum().alias("_net_attributed_6m"),
        )
        .with_columns(month_from_index("_mi").alias("month"))
        .drop("_mi")
    )
    return grid.select(KEY).join(exposure, on=KEY, how="left")


def _share(num: str, den: str) -> pl.Expr:
    """``num / den`` clipped to [0, 1], null when there is nothing in the denominator."""
    return (
        pl.when(pl.col(den) > 0)
        .then((pl.col(num).fill_null(0.0) / pl.col(den)).clip(0.0, 1.0))
        .otherwise(None)
    )


def bank_proxy_features(tx: pl.DataFrame, grid: pl.DataFrame) -> pl.DataFrame:
    """Add the three proxies and their coverage columns to the grid.

    Columns: ``returned_share``, ``returned_d3``, ``top_client_growth_bank``,
    ``top_client_bank_id``, ``top_client__proxy_coverage`` (attributed share of
    12m collections), ``network_exposure_bank``, ``network_payers_bank``,
    ``network__proxy_coverage`` (share of 6m collections from payers seen
    elsewhere in the portfolio), ``bank_collections_3m``.
    """
    coll = bank_collections(tx)
    attributed = coll.filter(pl.col("counterparty_ref").is_not_null())
    issued = attributed.group_by("company_id", "counterparty_ref", "month").agg(
        pl.col("amount_eur").sum().alias("billed")
    )
    top = top_client_growth(
        issued.rename({"counterparty_ref": "counterparty_id"}), grid
    ).rename(
        {
            "top_client_growth": "top_client_growth_bank",
            "top_client_id": "top_client_bank_id",
        }
    )
    panel = (
        grid.select(KEY)
        .join(_monthly_totals(coll, tx), on=KEY, how="left")
        .sort(KEY)
        .with_columns(
            rolling_sum("collected", 3).alias("bank_collections_3m"),
            rolling_sum("collected", TOP_WINDOW).alias("_col12"),
            rolling_sum("collected_attributed", TOP_WINDOW).alias("_att12"),
            rolling_sum("collected", NETWORK_WINDOW).alias("_col6"),
        )
    )
    panel = _returned_share(panel)
    panel = panel.join(top, on=KEY, how="left").join(
        _network_exposure_bank(attributed, grid), on=KEY, how="left"
    )
    return panel.with_columns(
        _share("_att12", "_col12").alias("top_client__proxy_coverage"),
        _share("_net_attributed_6m", "_col6").alias("network__proxy_coverage"),
    ).drop(
        "collected",
        "collected_attributed",
        "returned",
        "_col12",
        "_att12",
        "_col6",
        "_net_attributed_6m",
    )
