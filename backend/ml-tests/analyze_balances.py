"""Exploratory plots and outlier report for balances.csv.

Run from backend/ with:
    uv run python ml-tests/analyze_balances.py

Writes PNG charts and CSV reports to ml-tests/output/.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

from balances_outliers import column_summary, flag_outliers, iqr_bounds, load_balances

OUTPUT_DIR = Path(__file__).resolve().parent / "output"
COLORS = {"cash": "#4C72B0", "credit_line": "#DD8452"}


def plot_missingness(df: pd.DataFrame) -> None:
    """Bar chart of % missing values per numeric column."""
    pct = df[["balance", "available", "granted", "liquidity", "countable"]].isna().mean() * 100
    fig, ax = plt.subplots(figsize=(7, 4))
    pct.sort_values().plot.barh(ax=ax, color="#55A868")
    ax.set_xlabel("% missing")
    ax.set_title("Missing values per column")
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "01_missingness.png", dpi=150)
    plt.close(fig)


def plot_balance_distribution(df: pd.DataFrame) -> None:
    """Histogram of balance per product type, with IQR fences marked."""
    fig, ax = plt.subplots(figsize=(9, 5))
    for ptype, color in COLORS.items():
        sub = df.loc[df["product_type"] == ptype, "balance"].dropna()
        if sub.empty:
            continue
        ax.hist(sub, bins=80, alpha=0.6, label=ptype, color=color)
        low, high = iqr_bounds(sub)
        ax.axvline(low, color=color, linestyle="--", linewidth=1)
        ax.axvline(high, color=color, linestyle="--", linewidth=1)
    ax.set_xscale("symlog")
    ax.set_xlabel("balance (symlog scale)")
    ax.set_ylabel("count")
    ax.set_title("Balance distribution by product type\n(dashed lines = IQR fences)")
    ax.legend()
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "02_balance_distribution.png", dpi=150)
    plt.close(fig)


def plot_balance_boxplot(df: pd.DataFrame) -> None:
    """Boxplot of balance spread per product type."""
    fig, ax = plt.subplots(figsize=(6, 5))
    data = [df.loc[df["product_type"] == pt, "balance"].dropna() for pt in COLORS]
    ax.boxplot(data, tick_labels=list(COLORS), showfliers=True)
    ax.set_yscale("symlog")
    ax.set_ylabel("balance (symlog scale)")
    ax.set_title("Balance spread by product type")
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "03_balance_boxplot.png", dpi=150)
    plt.close(fig)


def plot_balance_timeseries(df: pd.DataFrame, outlier_mask: pd.Series) -> None:
    """Scatter of balance over time, highlighting IQR outliers in red."""
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.scatter(
        df.loc[~outlier_mask, "date"],
        df.loc[~outlier_mask, "balance"],
        s=6,
        alpha=0.15,
        color="#4C72B0",
        label="normal",
    )
    ax.scatter(
        df.loc[outlier_mask, "date"],
        df.loc[outlier_mask, "balance"],
        s=14,
        alpha=0.8,
        color="#C44E52",
        label="IQR outlier",
    )
    ax.set_yscale("symlog")
    ax.set_ylabel("balance (symlog scale)")
    ax.set_title("Balance over time, outliers highlighted")
    ax.legend()
    fig.autofmt_xdate()
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "04_balance_timeseries.png", dpi=150)
    plt.close(fig)


def plot_top_extremes(df: pd.DataFrame, n: int = 20) -> None:
    """Horizontal bar chart of the n most extreme balances by |value|."""
    top = df.reindex(df["balance"].abs().sort_values(ascending=False).index).head(n)
    labels = top["company_id"] + " / " + top["product_id"]
    colors = ["#C44E52" if v < 0 else "#55A868" for v in top["balance"]]
    fig, ax = plt.subplots(figsize=(8, 7))
    ax.barh(labels[::-1], top["balance"][::-1], color=colors[::-1])
    ax.set_xlabel("balance")
    ax.set_title(f"Top {n} most extreme balances (by |value|)")
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "05_top_extreme_balances.png", dpi=150)
    plt.close(fig)


def plot_liquidity_vs_granted(df: pd.DataFrame) -> None:
    """Scatter of credit headroom vs. limit; points above the diagonal are
    inconsistent (more liquidity than the granted limit allows)."""
    sub = df.dropna(subset=["granted", "liquidity"])
    if sub.empty:
        return
    fig, ax = plt.subplots(figsize=(7, 6))
    ax.scatter(sub["granted"].abs(), sub["liquidity"], s=10, alpha=0.4, color="#8172B2")
    limit = sub["granted"].abs().max()
    ax.plot([0, limit], [0, limit], color="black", linewidth=1, linestyle="--", label="liquidity = limit")
    ax.set_xlabel("|granted| (credit limit)")
    ax.set_ylabel("liquidity (headroom)")
    ax.set_title("Credit line headroom vs limit\n(points above the line are inconsistent)")
    ax.legend()
    fig.tight_layout()
    fig.savefig(OUTPUT_DIR / "06_liquidity_vs_granted.png", dpi=150)
    plt.close(fig)


def main() -> None:
    """Load balances.csv, report outliers, and render exploratory plots."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df = load_balances()

    summary = column_summary(df)
    summary.to_csv(OUTPUT_DIR / "outlier_summary.csv", index=False)
    print(summary.to_string(index=False))

    outlier_mask = flag_outliers(df, "balance", group_col="product_type")
    df.loc[outlier_mask].sort_values(
        "balance", key=lambda s: s.abs(), ascending=False
    ).to_csv(OUTPUT_DIR / "balance_outlier_rows.csv", index=False)
    print(
        f"\n{outlier_mask.sum()} / {len(df)} rows flagged as balance outliers "
        f"({100 * outlier_mask.mean():.2f}%)"
    )

    plot_missingness(df)
    plot_balance_distribution(df)
    plot_balance_boxplot(df)
    plot_balance_timeseries(df, outlier_mask)
    plot_top_extremes(df)
    plot_liquidity_vs_granted(df)
    print(f"\nPlots and CSV reports written to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
