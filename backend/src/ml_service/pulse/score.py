"""PULSE arithmetic: component percentiles -> variable scores (with bank-proxy fallback) -> weighted 0-100 PULSE + confidence."""

from __future__ import annotations

import polars as pl

from ml_service.pulse.variables import (
    MIN_PROXY_COVERAGE,
    PILLARS,
    VARIABLES,
    Variable,
    coverage_column,
)


def _effective(v: Variable, columns: set[str]) -> tuple[pl.Expr, pl.Expr, pl.Expr]:
    """(value, weight factor in [0, 1], source) for one variable.

    Primary components win. When all of them are unknown and the variable has
    bank proxies, the proxies are used and the factor is ``proxy_confidence``
    times the row's coverage column (1 when the panel has none). A coverage
    below ``MIN_PROXY_COVERAGE`` means the proxy saw too little of the
    company's collections to say anything: the variable stays unknown.
    """
    prim = [pl.col(f"{c.name}__pct") for c in v.components]
    prim_known = pl.any_horizontal([p.is_not_null() for p in prim])
    value = pl.when(prim_known).then(pl.mean_horizontal(prim))
    factor = pl.when(prim_known).then(pl.lit(1.0))
    source = pl.when(prim_known).then(pl.lit("primary"))
    if v.proxies:
        prox = [pl.col(f"{c.name}__pct") for c in v.proxies]
        prox_known = pl.any_horizontal([p.is_not_null() for p in prox])
        cov_col = coverage_column(v)
        coverage = (
            pl.col(cov_col).fill_null(1.0).clip(0.0, 1.0)
            if cov_col in columns
            else pl.lit(1.0)
        )
        prox_known = prox_known & (coverage >= MIN_PROXY_COVERAGE)
        value = value.when(prox_known).then(pl.mean_horizontal(prox))
        factor = factor.when(prox_known).then(v.proxy_confidence * coverage)
        source = source.when(prox_known).then(pl.lit("proxy"))
    return (
        value.otherwise(None),
        factor.otherwise(0.0),
        source.otherwise(pl.lit(None, dtype=pl.String)),
    )


def variable_scores(normed: pl.DataFrame) -> pl.DataFrame:
    """Add per variable: ``var_<key>`` (0-100), ``__known``, ``__weight`` (points it carries) and ``__source``."""
    exprs = []
    columns = set(normed.columns)
    for v in VARIABLES:
        value, factor, source = _effective(v, columns)
        exprs += [
            value.alias(f"var_{v.key}"),
            (factor > 0).alias(f"var_{v.key}__known"),
            (factor * v.weight).alias(f"var_{v.key}__weight"),
            source.alias(f"var_{v.key}__source"),
        ]
    return normed.with_columns(exprs)


def _weight(v: Variable) -> pl.Expr:
    return pl.col(f"var_{v.key}__weight")


def weighted_score(scored: pl.DataFrame) -> pl.DataFrame:
    """Add ``pulse`` (weighted mean of the known variables, weights renormalised), ``confidence`` (points backed by data / 100) and pillar scores.

    A proxy-backed variable carries only ``proxy_confidence`` x coverage of its
    weight, so it moves the score less and lowers ``confidence`` accordingly.
    """
    num = sum(pl.col(f"var_{v.key}").fill_null(0.0) * _weight(v) for v in VARIABLES)
    den = sum(_weight(v) for v in VARIABLES)
    out = scored.with_columns(
        pl.when(den > 0).then(num / den).otherwise(None).alias("pulse"),
        (den / 100.0).alias("confidence"),
        (
            sum(
                pl.when(pl.col(f"var_{v.key}__source") == "proxy")
                .then(_weight(v))
                .otherwise(0.0)
                for v in VARIABLES
            )
            / 100.0
        ).alias("confidence_from_proxies"),
    )
    pillar_exprs = []
    for pillar in PILLARS:
        vs = [v for v in VARIABLES if v.pillar == pillar]
        pn = sum(pl.col(f"var_{v.key}").fill_null(0.0) * _weight(v) for v in vs)
        pd = sum(_weight(v) for v in vs)
        pillar_exprs.append(
            pl.when(pd > 0).then(pn / pd).otherwise(None).alias(f"pillar_{pillar}")
        )
    return out.with_columns(pillar_exprs)


def contributions(scored: pl.DataFrame) -> pl.DataFrame:
    """Add ``contrib_<key>``: points of PULSE each variable is responsible for (sum = pulse)."""
    den = sum(_weight(v) for v in VARIABLES)
    return scored.with_columns(
        [
            (pl.col(f"var_{v.key}").fill_null(0.0) * _weight(v) / den).alias(
                f"contrib_{v.key}"
            )
            for v in VARIABLES
        ]
    )
