"""Build ``CompanySnapshot`` objects from the scored panel, the forecast and the raw products/invoices."""

from __future__ import annotations

import math

import polars as pl

from ml_service.pulse.export_web import RAW_OF
from ml_service.pulse.recommend.snapshot import (
    CompanySnapshot,
    Holdings,
    InvoiceBook,
    Outlook,
    VariableReading,
)
from ml_service.pulse.variables import PILLARS, VARIABLES

LOAN_TYPES = ("loan", "leasing", "mortgage")
OVERDUE_CUTOFF_DAYS = 90
RECENT_MONTHS = 3


def _num(x) -> float | None:
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return None
    return float(x)


def _outlooks(forecast: pl.DataFrame) -> dict[str, Outlook]:
    h6 = forecast.filter(pl.col("horizon") == forecast["horizon"].max())
    return {
        r["company_id"]: Outlook(
            _num(r["pulse_pred"]), _num(r["pulse_p10"]), _num(r["pulse_p90"])
        )
        for r in h6.to_dicts()
    }


def _variables(row: dict) -> dict[str, VariableReading]:
    out = {}
    for v in VARIABLES:
        known = bool(row.get(f"var_{v.key}__known"))
        out[v.key] = VariableReading(
            score=_num(row.get(f"var_{v.key}")) if known else None,
            raw=_num(row.get(RAW_OF[v.key])) if known else None,
            known=known,
            source=row.get(f"var_{v.key}__source"),
        )
    return out


def latest_rows(scored: pl.DataFrame) -> pl.DataFrame:
    """Last scored month of every company, with the 3-month change of ``pulse_raw``."""
    ordered = scored.filter(pl.col("pulse").is_not_null()).sort("company_id", "month")
    with_d3 = ordered.with_columns(
        (pl.col("pulse_raw") - pl.col("pulse_raw").shift(3).over("company_id")).alias(
            "pulse_raw_d3"
        )
    )
    return with_d3.group_by("company_id", maintain_order=True).last()


def build_snapshots(
    scored: pl.DataFrame,
    forecast: pl.DataFrame,
    holdings: dict[str, Holdings],
    books: dict[str, InvoiceBook],
) -> list[CompanySnapshot]:
    """One snapshot per company from its latest scored month."""
    outlooks = _outlooks(forecast)
    snaps = []
    for r in latest_rows(scored).to_dicts():
        cid = r["company_id"]
        snaps.append(
            CompanySnapshot(
                company_id=cid,
                month=r["month"].strftime("%Y-%m"),
                pulse=float(r["pulse"]),
                pulse_raw=float(r["pulse_raw"]),
                confidence=float(r["confidence"]),
                months_observed=int(r["months_observed"]),
                pillars={p: _num(r.get(f"pillar_{p}")) for p in PILLARS},
                variables=_variables(r),
                cash_end=_num(r.get("cash_end")),
                monthly_outflow=float(r.get("outflow_3m") or 0.0) / 3.0,
                monthly_collections=float(r.get("bank_collections_3m") or 0.0) / 3.0,
                service_3m=float(r.get("service_3m") or 0.0),
                pulse_raw_d3=_num(r.get("pulse_raw_d3")),
                holdings=holdings.get(cid, Holdings()),
                invoices=books.get(cid, InvoiceBook()),
                outlook=outlooks.get(cid, Outlook()),
            )
        )
    return snaps
