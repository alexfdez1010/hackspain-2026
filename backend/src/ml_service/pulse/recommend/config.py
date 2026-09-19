"""Reference rates, pricing parameters and rule thresholds for the recommender.

Every number that shapes a recommendation lives here so the explanation shown
to the company can quote it. Rates are annual decimals; spreads are basis points.
"""

from __future__ import annotations

import os
from pathlib import Path

from ml_service.pulse.config import WORK_DIR

RECO_DIR = WORK_DIR / "recommendations"
RISK_MODEL_FILE = WORK_DIR / "models" / "risk_model.json"
RISK_EVALUATION_FILE = WORK_DIR / "risk_evaluation.json"

# --- Pricing --------------------------------------------------------------
EURIBOR_12M = float(os.getenv("PULSE_EURIBOR_12M", "0.021"))
"""Reference rate every cost product is priced over (override with PULSE_EURIBOR_12M)."""
REFERENCE_RATE_LABEL = "Euríbor 12 m"
MAX_RISK_PREMIUM_BPS = 900
MAX_DATA_UNCERTAINTY_BPS = 75
"""Premium charged when ``confidence`` is 0; scales linearly with (1 - confidence)."""
TREND_DECLINE_POINTS = -5.0  # forecast +12 m vs today, PULSE points
TREND_IMPROVE_POINTS = 5.0
TREND_DECLINE_BPS = 25
TREND_IMPROVE_BPS = -15
HIGH_UTILISATION = 0.90
HIGH_UTILISATION_BPS = 25
DEPOSIT_STICKY_BONUS_BPS = 15
"""Extra yield when excess cash covers more than a year of outflows."""
STICKY_CASH_DAYS = 365.0
MIN_CONFIDENCE_FOR_CREDIT = 0.25
"""Below this share of data-backed points no credit product is offered."""

# --- Eligibility thresholds (raw variable units) ----------------------------
LOW_CASH_DAYS = 30.0
COMFORT_CASH_DAYS = 90.0
EXCESS_CASH_DAYS = 180.0
LOW_CASH_MIN_RATIO = 0.25  # lowest intramonth cash < 25 % of a month of outflows
UTIL_HIGH = 0.80
UTIL_LOW = 0.30
LONG_DSO_DAYS = 45.0
FACTORING_MAX_AR90 = 0.40  # receivables must be reasonably current
SHORT_TERMS_DAYS = 20.0
HIGH_MATURITY_RATIO = 1.0  # six months of debt service exceed month-end cash
SEVERE_MATURITY_RATIO = 3.0
MIN_PULSE_NEW_CREDIT = 30.0
MIN_PULSE_INVESTMENT_LOAN = 60.0
MIN_PULSE_FACTORING = 20.0
MIN_ELIGIBLE_AR_EUR = 20_000.0
MIN_MONTHLY_PURCHASES_EUR = 15_000.0
MIN_OUTFLOW_EUR = 5_000.0
MIN_EXCESS_CASH_EUR = 50_000.0

# --- Sizing ------------------------------------------------------------------
MAX_FACILITY_EUR = 2_000_000.0
MIN_FACILITY_EUR = 10_000.0
ROUND_TO_EUR = 5_000.0
COVER_MONTHS_BY_PULSE: tuple[tuple[float, float], ...] = (
    (75.0, 1.5),
    (50.0, 1.0),
    (35.0, 0.6),
    (0.0, 0.35),
)
"""Months of operating outflow a new credit line covers, by PULSE band."""
LINE_INCREASE_BY_PULSE: tuple[tuple[float, float], ...] = (
    (65.0, 0.50),
    (45.0, 0.30),
    (0.0, 0.15),
)
FACTORING_ADVANCE_RATE = 0.85
FACTORING_ADVANCE_RATE_WEAK = 0.75  # when the +90 d bucket is not negligible
CONFIRMING_MONTHS_OF_PURCHASES = 1.5
DEPOSIT_KEEP_DAYS = 90.0  # operating buffer never proposed for a deposit
DEPOSIT_TENORS_MONTHS = (3, 6, 12)
LOAN_MONTHS_OF_COLLECTIONS = 3.0
LOAN_TENOR_MONTHS = 48
REFINANCE_TENOR_MONTHS = 60

MAX_RECOMMENDATIONS = 3
MIN_FIT_TO_RECOMMEND = 40.0


def reco_dir(work_dir: Path | None = None) -> Path:
    """Output folder of the recommender inside ``work_dir`` (default ``data/pulse``)."""
    return (work_dir or WORK_DIR) / "recommendations"
