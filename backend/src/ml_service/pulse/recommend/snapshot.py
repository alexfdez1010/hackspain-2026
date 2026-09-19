"""What the advisor knows about one company at its latest scored month."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field


@dataclass(frozen=True)
class VariableReading:
    """One PULSE variable as the company sees it: percentile score plus the raw number."""

    score: float | None
    raw: float | None
    known: bool
    source: str | None = None


@dataclass(frozen=True)
class Holdings:
    """Financing the company already has, from ``debt_products`` and ``debt_schedule_config``."""

    types: tuple[str, ...] | list[str] = ()
    line_limit: float = 0.0
    line_drawn: float = 0.0
    loan_outstanding: float = 0.0
    n_loans: int = 0
    current_rate: float | None = None
    """Median rate of the company's scheduled loans, when the schedule reports one."""

    def has(self, dataset_type: str | None) -> bool:
        """Whether the company already holds a product of this dataset ``type``."""
        return dataset_type is not None and dataset_type in self.types

    @property
    def line_available(self) -> float:
        return max(self.line_limit - self.line_drawn, 0.0)


@dataclass(frozen=True)
class InvoiceBook:
    """Open and recent invoices in EUR, from the cleaned ERP invoices (zeros when no ERP)."""

    has_erp: bool = False
    open_ar: float = 0.0
    eligible_ar: float = 0.0
    """Open receivables not yet 90 days past due: what a factor would advance."""
    ar_monthly: float = 0.0
    open_ap: float = 0.0
    ap_monthly: float = 0.0


@dataclass(frozen=True)
class Outlook:
    """Six-month (+6) PULSE forecast produced by ``pulse.forecast``."""

    pulse_pred: float | None = None
    pulse_p10: float | None = None
    pulse_p90: float | None = None


@dataclass(frozen=True)
class CompanySnapshot:
    """Everything a recommendation is computed from; all amounts in EUR."""

    company_id: str
    month: str
    pulse: float
    confidence: float
    months_observed: int
    pillars: dict[str, float | None]
    variables: dict[str, VariableReading]
    cash_end: float | None
    monthly_outflow: float
    monthly_collections: float
    service_3m: float
    pulse_d3: float | None
    holdings: Holdings = field(default_factory=Holdings)
    invoices: InvoiceBook = field(default_factory=InvoiceBook)
    outlook: Outlook = field(default_factory=Outlook)

    def raw(self, key: str) -> float | None:
        """Raw value of a variable, or None when unknown."""
        v = self.variables.get(key)
        return v.raw if v and v.known else None

    def score(self, key: str) -> float | None:
        """Percentile score of a variable, or None when unknown."""
        v = self.variables.get(key)
        return v.score if v and v.known else None

    @property
    def forecast_delta(self) -> float | None:
        """Expected PULSE change at +6 months (None without a forecast)."""
        if self.outlook.pulse_pred is None:
            return None
        return self.outlook.pulse_pred - self.pulse

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> CompanySnapshot:
        """Inverse of :meth:`to_dict` (nested dataclasses rebuilt)."""
        return cls(
            **{
                **data,
                "variables": {
                    k: VariableReading(**v) for k, v in data["variables"].items()
                },
                "holdings": Holdings(**data["holdings"]),
                "invoices": InvoiceBook(**data["invoices"]),
                "outlook": Outlook(**data["outlook"]),
            }
        )
