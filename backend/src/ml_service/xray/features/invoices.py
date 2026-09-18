"""Monthly features derived from ERP invoices (receivables and payables).

Every feature is point-in-time: at month m only payments dated <= end of m are
known, so overdue balances never peek into the future.
"""

from __future__ import annotations

from datetime import datetime

import polars as pl

from ml_service.xray.config import FIRST_MONTH, LAST_FULL_MONTH
from ml_service.xray.io import Dataset

MAX_DELAY_DAYS = 365
MIN_DELAY_DAYS = -90
HHI_WINDOW_MONTHS = 3


def _clean(ds: Dataset) -> pl.DataFrame:
    """Invoices with accounting-currency amounts, side and sanitised dates."""
    inv = ds.table("invoices").filter(pl.col("status") != "cancel")
    fx = pl.col("exchange_rate").fill_null(1.0)
    fx = pl.when((fx > 0.001) & (fx < 500)).then(fx).otherwise(1.0)
    sane = lambda c: (
        pl.when(
            (pl.col(c) >= datetime(2015, 1, 1)) & (pl.col(c) <= datetime(2030, 12, 31))
        )
        .then(pl.col(c))
        .otherwise(None)
    )
    # The ERP fills payment_date with the due date on unpaid documents, so a
    # payment date only counts when the document is actually settled.
    settled = (pl.col("status") == "paid") & (pl.col("pending_amount").abs() < 0.01)
    return inv.with_columns(
        (pl.col("amount").abs() * fx).alias("value"),
        pl.when(pl.col("amount") > 0)
        .then(pl.lit("ar"))
        .otherwise(pl.lit("ap"))
        .alias("side"),
        sane("due_date").alias("due_date"),
        pl.when(settled)
        .then(sane("payment_date"))
        .otherwise(None)
        .alias("payment_date"),
    ).with_columns(pl.col("due_date").fill_null(pl.col("issuance_date")))


def issued_features(inv: pl.DataFrame) -> pl.DataFrame:
    """Volume and count of documents issued per company-month and side."""
    out = (
        inv.with_columns(pl.col("issuance_date").dt.truncate("1mo").alias("month"))
        .group_by("company_id", "month", "side")
        .agg(pl.col("value").sum().alias("issued"), pl.len().alias("n_issued"))
    )
    return out.pivot(
        on="side", index=["company_id", "month"], values=["issued", "n_issued"]
    )


def paid_delay_features(inv: pl.DataFrame) -> pl.DataFrame:
    """Value-weighted payment delay (days after due date) for documents paid in month."""
    paid = inv.filter(pl.col("payment_date").is_not_null()).with_columns(
        (pl.col("payment_date") - pl.col("due_date"))
        .dt.total_days()
        .clip(MIN_DELAY_DAYS, MAX_DELAY_DAYS)
        .alias("delay"),
        pl.col("payment_date").dt.truncate("1mo").alias("month"),
    )
    out = paid.group_by("company_id", "month", "side").agg(
        pl.when(pl.col("value").sum() > 0)
        .then((pl.col("delay") * pl.col("value")).sum() / pl.col("value").sum())
        .otherwise(pl.col("delay").mean())
        .alias("delay_days"),
        (pl.col("delay") > 0).mean().alias("late_share"),
        pl.col("value").sum().alias("paid"),
    )
    return out.pivot(
        on="side",
        index=["company_id", "month"],
        values=["delay_days", "late_share", "paid"],
    )


def overdue_features(inv: pl.DataFrame) -> pl.DataFrame:
    """Point-in-time overdue balance at each month end, per side."""
    months = pl.datetime_range(FIRST_MONTH, LAST_FULL_MONTH, "1mo", eager=True)
    due_m = pl.col("due_date").dt.truncate("1mo")
    end_m = pl.coalesce(
        pl.col("payment_date").dt.truncate("1mo"),
        pl.lit(LAST_FULL_MONTH) + pl.duration(days=40),
    )
    rng = inv.select(
        "company_id",
        "side",
        "value",
        due_m.alias("start"),
        end_m.dt.truncate("1mo").alias("stop"),
    ).filter(pl.col("start") <= pl.lit(LAST_FULL_MONTH))
    rng = rng.with_columns(
        pl.int_ranges(
            (pl.col("start").dt.year() - FIRST_MONTH.year) * 12
            + pl.col("start").dt.month()
            - FIRST_MONTH.month
            + 1,
            (pl.col("stop").dt.year() - FIRST_MONTH.year) * 12
            + pl.col("stop").dt.month()
            - FIRST_MONTH.month
            + 1,
        ).alias("idx")
    )
    # overdue at the end of every month from the due month up to the month before payment
    exploded = (
        rng.explode("idx")
        .filter(pl.col("idx") >= 1)
        .filter(pl.col("idx") <= len(months))
    )
    idx_to_month = pl.DataFrame({"idx": range(1, len(months) + 1), "month": months})
    out = (
        exploded.join(idx_to_month, on="idx")
        .group_by("company_id", "month", "side")
        .agg(pl.col("value").sum().alias("overdue"), pl.len().alias("n_overdue"))
    )
    return out.pivot(
        on="side", index=["company_id", "month"], values=["overdue", "n_overdue"]
    )


def concentration_features(inv: pl.DataFrame) -> pl.DataFrame:
    """Customer concentration (HHI) of receivables over a trailing window."""
    ar = inv.filter((pl.col("side") == "ar") & pl.col("counterparty_id").is_not_null())
    monthly = (
        ar.with_columns(pl.col("issuance_date").dt.truncate("1mo").alias("month"))
        .group_by("company_id", "counterparty_id", "month")
        .agg(pl.col("value").sum())
    )
    frames = [
        monthly.with_columns(pl.col("month").dt.offset_by(f"{k}mo"))
        for k in range(HHI_WINDOW_MONTHS)
    ]
    window = (
        pl.concat(frames)
        .group_by("company_id", "counterparty_id", "month")
        .agg(pl.col("value").sum())
    )
    return (
        window.group_by("company_id", "month")
        .agg(
            ((pl.col("value") / pl.col("value").sum()) ** 2)
            .sum()
            .alias("customer_concentration"),
            pl.col("counterparty_id").n_unique().alias("n_customers"),
        )
        .filter(pl.col("month") <= pl.lit(LAST_FULL_MONTH))
    )


def build_invoice_features(ds: Dataset) -> pl.DataFrame:
    """Join every invoice-derived feature into one company-month frame."""
    if not ds.table("invoices").height:
        return pl.DataFrame(
            schema={"company_id": pl.String, "month": pl.Datetime("us")}
        )
    inv = _clean(ds)
    out = issued_features(inv)
    for fn in (paid_delay_features, overdue_features, concentration_features):
        out = out.join(fn(inv), on=["company_id", "month"], how="full", coalesce=True)
    return out.sort("company_id", "month")
