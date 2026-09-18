"""SHAP-based explanations: per-feature score attribution, reasons and narratives."""

from ml_service.xray.explain.attribution import (
    SHAP_SUFFIX,
    explain_rows,
    shap_feature_names,
)
from ml_service.xray.explain.narrative import explain_change, regime_text_es
from ml_service.xray.explain.reasons import top_reasons

__all__ = [
    "SHAP_SUFFIX",
    "explain_change",
    "explain_rows",
    "regime_text_es",
    "shap_feature_names",
    "top_reasons",
]
