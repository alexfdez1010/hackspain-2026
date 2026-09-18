"""Paths, constants and feature registry for the X-Ray engine."""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

ML_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = Path(os.getenv("XRAY_DATA_DIR", ML_ROOT / "data"))
RAW_DIR = DATA_DIR / "raw" / "xray"
PARQUET_DIR = DATA_DIR / "parquet"
FEATURES_DIR = DATA_DIR / "features"
MODELS_DIR = DATA_DIR / "models"
OUTPUT_DIR = DATA_DIR / "output"

EXTRACTION_DATE = datetime(2026, 9, 1)
FIRST_MONTH = datetime(2024, 9, 1)
LAST_FULL_MONTH = datetime(2026, 8, 1)  # 2026-09 only has one day of data

RAW_TABLES = (
    "groups",
    "companies",
    "banking_products",
    "debt_products",
    "debt_schedule_config",
    "balances",
    "invoices",
    "transactions",
)

CASH_ACCOUNT_TYPES = ("checking", "saving", "wallet", "expensesPlatform")
INTERCOMPANY_REGEX = (
    r"(?i)traspaso|intercompany|transfer(encia)? (a|desde|entre) (cta|cuenta)"
)

# Narrative regexes for stress events found in bank descriptions (Spanish banks).
STRESS_REGEX = {
    "returned_debit": r"(?i)impagad|devoluci[oó]n recibo|devol\.? recibo|recibo devuelto|adeudo devuelto",
    "overdraft": r"(?i)descubierto|excedido|int(\.|ereses)? deudor",
    "late_fee": r"(?i)demora|recargo|reclamaci[oó]n|apremio",
    "seizure": r"(?i)embargo|diligencia",
}


@dataclass(frozen=True)
class FeatureSpec:
    """Metadata describing one panel feature.

    Attributes:
        name: Column name in the monthly panel.
        pillar: Pillar the feature belongs to (liquidity, cashflow, payments,
            receivables, debt, activity).
        direction: +1 if higher values mean healthier, -1 otherwise.
        label_es: Human-readable Spanish label for explanations.
    """

    name: str
    pillar: str
    direction: int
    label_es: str


FEATURE_SPECS: tuple[FeatureSpec, ...] = (
    FeatureSpec("cash_runway_months", "liquidity", 1, "Meses de caja disponibles"),
    FeatureSpec("cash_to_inflow", "liquidity", 1, "Caja sobre cobros mensuales"),
    FeatureSpec("neg_balance_share", "liquidity", -1, "Días con saldo negativo"),
    FeatureSpec("min_balance_ratio", "liquidity", 1, "Saldo mínimo intramensual"),
    FeatureSpec("cash_change_3m", "liquidity", 1, "Variación de caja (3 meses)"),
    FeatureSpec("net_margin", "cashflow", 1, "Margen neto de caja"),
    FeatureSpec("net_margin_3m", "cashflow", 1, "Margen neto de caja (3 meses)"),
    FeatureSpec("inflow_growth_3m", "cashflow", 1, "Crecimiento de cobros (3 meses)"),
    FeatureSpec("inflow_growth_6m", "cashflow", 1, "Crecimiento de cobros (6 meses)"),
    FeatureSpec("inflow_volatility", "cashflow", -1, "Volatilidad de cobros"),
    FeatureSpec("net_positive_share_6m", "cashflow", 1, "Meses con caja neta positiva"),
    FeatureSpec("returned_debit_rate", "payments", -1, "Recibos devueltos"),
    FeatureSpec(
        "stress_event_rate", "payments", -1, "Descubiertos, demoras y embargos"
    ),
    FeatureSpec(
        "supplier_delay_days", "payments", -1, "Retraso medio pagando proveedores"
    ),
    FeatureSpec(
        "payables_overdue_share", "payments", -1, "Facturas a proveedor vencidas"
    ),
    FeatureSpec("tax_regularity", "payments", 1, "Regularidad con Hacienda y TGSS"),
    FeatureSpec("dso_days", "receivables", -1, "Retraso medio de cobro (DSO)"),
    FeatureSpec(
        "receivables_overdue_share", "receivables", -1, "Facturas a cliente vencidas"
    ),
    FeatureSpec(
        "customer_concentration", "receivables", -1, "Concentración de clientes"
    ),
    FeatureSpec("collection_growth_3m", "receivables", 1, "Crecimiento de facturación"),
    FeatureSpec("loc_utilization", "debt", -1, "Uso de líneas de crédito"),
    FeatureSpec("debt_service_ratio", "debt", -1, "Servicio de deuda sobre cobros"),
    FeatureSpec("financing_cost_ratio", "debt", -1, "Coste financiero sobre cobros"),
    FeatureSpec("leverage_ratio", "debt", -1, "Deuda sobre cobros anuales"),
    FeatureSpec("loc_util_change_3m", "debt", -1, "Variación uso de crédito (3 meses)"),
    FeatureSpec("activity_growth_3m", "activity", 1, "Crecimiento de actividad"),
    FeatureSpec("payroll_growth_3m", "activity", 1, "Crecimiento de nóminas"),
    FeatureSpec("counterparty_growth_3m", "activity", 1, "Crecimiento de contrapartes"),
)

PILLARS: tuple[str, ...] = (
    "liquidity",
    "cashflow",
    "payments",
    "receivables",
    "debt",
    "activity",
)
PILLAR_LABELS_ES = {
    "liquidity": "Liquidez",
    "cashflow": "Flujo de caja",
    "payments": "Comportamiento de pago",
    "receivables": "Calidad de cobros",
    "debt": "Deuda y financiación",
    "activity": "Actividad",
}
