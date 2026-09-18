"""Dataset loading: raw CSV folder -> cached Parquet tables."""

from __future__ import annotations

from pathlib import Path

import polars as pl

from ml_service.xray.config import PARQUET_DIR, RAW_DIR, RAW_TABLES


class Dataset:
    """Lazy accessor over the nine X-Ray tables of one data folder.

    Args:
        raw_dir: Folder holding the CSV files (train set or hidden test set).
        cache_dir: Where Parquet copies are written; defaults to a folder named
            after the raw folder inside the parquet cache.
    """

    def __init__(self, raw_dir: Path = RAW_DIR, cache_dir: Path | None = None):
        self.raw_dir = Path(raw_dir)
        self.cache_dir = cache_dir or (PARQUET_DIR / self.raw_dir.name)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def table(self, name: str) -> pl.DataFrame:
        """Return one table, converting CSV to Parquet on first access."""
        if name not in RAW_TABLES:
            raise ValueError(f"Unknown table {name!r}")
        cached = self.cache_dir / f"{name}.parquet"
        if not cached.exists():
            csv = self.raw_dir / f"{name}.csv"
            if not csv.exists():
                return pl.DataFrame()
            df = pl.read_csv(csv, infer_schema_length=100_000, try_parse_dates=True, null_values=[""])
            df.write_parquet(cached)
        return pl.read_parquet(cached)

    def product_types(self) -> pl.DataFrame:
        """Map product_id -> product type across banking and debt products."""
        bp = self.table("banking_products")
        dp = self.table("debt_products")
        frames = [t.select("product_id", "type") for t in (bp, dp) if t.height]
        return pl.concat(frames).unique("product_id") if frames else pl.DataFrame(
            schema={"product_id": pl.String, "type": pl.String}
        )
