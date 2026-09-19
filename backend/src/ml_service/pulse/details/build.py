"""Assemble the per-variable detail payload of every company from the shared tables."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.clean.pipeline import CleanData
from ml_service.pulse.details import aging, cash, debt, network, payables, receivables
from ml_service.pulse.details.common import Blocks, DetailContext, make_context
from ml_service.pulse.load import RawData
from ml_service.pulse.variables import VARIABLES

BUILDERS = (
    cash.blocks,
    debt.blocks,
    payables.blocks,
    receivables.blocks,
    aging.blocks,
    network.blocks,
)
VARIABLE_KEYS = tuple(v.key for v in VARIABLES)


def detail_tables(ctx: DetailContext) -> dict[str, Blocks]:
    """Run every builder once for the whole population, keyed by variable then company."""
    tables: dict[str, Blocks] = {}
    for builder in BUILDERS:
        tables.update(builder(ctx))
    missing = set(VARIABLE_KEYS) - set(tables)
    if missing:
        raise RuntimeError(f"no detail builder for {sorted(missing)}")
    return tables


def company_payload(company_id: str, month: str, tables: dict[str, Blocks]) -> dict:
    """One company's payload with every variable key present, in the published order."""
    return {
        "company_id": company_id,
        "month": month,
        "variables": {k: tables[k][company_id] for k in VARIABLE_KEYS},
    }


def build_payloads(
    clean: CleanData,
    raw: RawData,
    scored: pl.DataFrame,
    companies: list[str] | None = None,
) -> dict[str, dict]:
    """Detail payload of every exported company, built from the cleaned frames once."""
    ctx = make_context(
        clean, raw.banking_products, raw.debt_schedule_config, scored, companies
    )
    tables = detail_tables(ctx)
    months = {
        r["company_id"]: r["ref_month"].strftime("%Y-%m") for r in ctx.ref.to_dicts()
    }
    return {cid: company_payload(cid, months[cid], tables) for cid in ctx.companies}
