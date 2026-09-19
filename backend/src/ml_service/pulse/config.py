"""Paths, dataset constants and cleaning thresholds for PULSE."""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

ML_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = Path(os.getenv("PULSE_DATA_DIR", ML_ROOT / "data"))
RAW_DIR = DATA_DIR / "raw" / "xray"
WORK_DIR = DATA_DIR / "pulse"

EXTRACTION_DATE = datetime(2026, 9, 1)
FIRST_MONTH = datetime(2024, 9, 1)
LAST_FULL_MONTH = datetime(2026, 8, 1)

CASH_TYPES = ("checking", "saving", "wallet")
CREDIT_LINE_TYPES = ("lineofcredit", "lineofcomex")
DEBT_TYPES = ("loan", "leasing", "mortgage", "lineofcredit", "confirming", "factoring")
DEBT_SERVICE_CATEGORIES = ("debt_repayment", "interest_charge")
INVOICE_DOC_TYPES = ("invoice", "invoiceGroup")
INTERCOMPANY_REGEX = r"(?i)traspaso|intercompany|intragrupo|transfer(encia)? (a|desde|entre) (cta|cuenta)"


@dataclass(frozen=True)
class CleaningThresholds:
    """Rules that decide what is corrupt. All amounts in EUR."""

    tx_outlier_mult: float = 20.0  # |amount| > mult x company p99 ...
    tx_outlier_min: float = 1e6  # ... and above this absolute floor -> dropped
    tx_abs_cap: float = 1e9  # anything above is dropped regardless
    inv_outlier_mult: float = 20.0
    inv_outlier_min: float = 1e6
    balance_mult: float = 20.0  # |balance| > mult x gross monthly flow -> unanchored
    balance_min: float = 1e6
    max_terms_days: int = 365  # due - issuance outside [0, max] -> due unknown
    max_pay_days: int = 730  # payment - issuance outside [0, max] -> payment unknown
    max_value_date_gap: int = 30


CLEAN = CleaningThresholds()
