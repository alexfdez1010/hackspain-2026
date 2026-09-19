"""Registry of the eligibility rules, one per catalogue product."""

from __future__ import annotations

from collections.abc import Callable

from ml_service.pulse.recommend.catalogue import PRODUCTS
from ml_service.pulse.recommend.rules_common import Assessment
from ml_service.pulse.recommend.rules_debt import term_loan
from ml_service.pulse.recommend.rules_liquidity import (
    credit_line,
    credit_line_increase,
)
from ml_service.pulse.recommend.rules_payables import confirming
from ml_service.pulse.recommend.rules_receivables import factoring
from ml_service.pulse.recommend.rules_refinancing import refinancing
from ml_service.pulse.recommend.rules_treasury import treasury_deposit
from ml_service.pulse.recommend.snapshot import CompanySnapshot

Rule = Callable[[CompanySnapshot], Assessment]

RULES: dict[str, Rule] = {
    "credit_line": credit_line,
    "credit_line_increase": credit_line_increase,
    "factoring": factoring,
    "confirming": confirming,
    "term_loan": term_loan,
    "refinancing": refinancing,
    "treasury_deposit": treasury_deposit,
}
assert set(RULES) == {p.key for p in PRODUCTS}


def assess_all(snapshot: CompanySnapshot) -> list[Assessment]:
    """Run every rule; the caller decides what to do with eligible and blocked products."""
    return [rule(snapshot) for rule in RULES.values()]
