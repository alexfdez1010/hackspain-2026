# 📦 JSON contract of the output folder

What `uv run pulse` writes into the output folder (default
`data/pulse/export/`, or `--out ../frontend/src/data/pulse` to feed the web
app). The web app reads these files as they are; this document is the
**contract between the two apps** and the backend owns it. Field lists match
what the frontend parsers accept (`frontend/src/lib/pulse`,
`frontend/src/lib/advisor`).

```
<out>/
├── summary.json                       score definition + latest PULSE of every company
├── companies/<company_id>.json        monthly history, 6-month forecast, signals
├── details/<company_id>.json          what is behind each variable at the last month
├── recommendations/
│   ├── catalogue.json                 products, pricing parameters, risk-model figures
│   └── companies/<company_id>.json    full explainable recommendation
├── reports/                           cleaning + evaluation reports (see model-selection.md)
└── manifest.json                      when, from which dataset, how many files
```

Conventions: company ids look like `COMP_0001`, months like `YYYY-MM`,
amounts are EUR rounded to two decimals, and a variable without evidence
arrives with `known: false` and `null` figures, never a zero.

| Field | Values |
|---|---|
| PULSE pillars | `liquidez` · `deuda` · `cobro` · `pago` |
| PULSE variables | `cash_days` · `cash_min` · `loc_util` · `loc_accel` · `dpo` · `terms` · `dso` · `ar90` · `top_client` · `maturities` · `network` |
| Advisor products | `credit_line` · `credit_line_increase` · `factoring` · `confirming` · `term_loan` · `refinancing` · `treasury_deposit` |
| `rate_kind` | `cost` (the company pays) · `yield` (the company earns, deposit) |
| Signal `kind` | `caida` · `bache` · `mejora` · `repunte` |

---

## `summary.json`

Score definition (pillars, variables, weights, forecast horizons), the
published evaluation figures and one row per company with its latest PULSE.

```jsonc
{
  "generated_for": "HackSpain 2026 · Embat PULSE",
  "score_name": "PULSE",
  "score_expansion": "Payment, Underwriting, Liquidity & Solvency Estimate",
  "horizons": [1, 2, 3, 4, 5, 6],
  "last_month": "2026-08",
  "pillars": [
    {"key": "liquidez", "label": "Liquidez", "weight": 26},
    {"key": "deuda",    "label": "Deuda y servicio", "weight": 26},
    {"key": "cobro",    "label": "Calidad de cobro", "weight": 36},
    {"key": "pago",     "label": "Comportamiento de pago", "weight": 12}
  ],
  "variables": [
    {"key": "cash_days", "number": 1, "label": "Días de caja", "pillar": "liquidez",
     "weight": 12, "raw": "cash_days", "unit": "días"}
    // ... 11 in total
  ],
  "contribution_keys": ["cash_days", "cash_min", "...", "network", "contexto", "base"],
  "evaluation": {
    "score":    {"rows": 14521, "stress_rate": 0.2238, "auroc": 0.821,
                 "auroc_excluding_current_stress": 0.6387, "auroc_temporal": 0.8091,
                 "auroc_by_variable": {"cash_days": 0.8587, "...": 0}},
    "forecast": {"horizons": {"1": {"n": 20932, "mae_persist": 5.72, "mae_reversion": 5.891, "mae_ml": 5.529,
                                    "gain_vs_persist_pct": 1.1, "gain_vs_reversion_pct": 4.0,
                                    "direction_accuracy_big_moves": 0.865, "recall_declines": 0.531,
                                    "recall_improvements": 0.461, "band_p10_p90_coverage": 0.799}, "...": {}}},
    "risk":     {"rows": 14514, "stress_rate": 0.2239, "auroc": 0.871, "coefficients_std": {"pillar_liquidez": -1.91, "...": 0}},
    "signals":  {"anticipation": {"clean_rows": 17065, "alert_share": 0.2, "horizons": {"1": {"rows": 16026, "base_rate": 0.0231, "auroc": 0.6682, "recall": 0.427, "precision": 0.0493, "lift": 2.13}, "...": {}}},
                 "persistence": {"down": {"signals": 1858, "persistent_share": 0.6529, "oof_auroc": 0.7467, "coefficients_std": {}}, "up": {}}}
  },
  "companies": [
    {
      "company_id": "COMP_0001",
      "group_id": "GROUP_0147",
      "months_observed": 8,
      "pulse": 32.77,                             // latest PULSE, 0-100
      "pulse_prev": 17.88,
      "confidence": 0.82,                         // share of the score backed by data, 0-1
      "pillars": {"liquidez": 34.3, "deuda": 34.0, "pago": 51.1, "cobro": 54.6},
      "forecast_6m": {"pulse_pred": 31.07, "pulse_p10": 15.58, "pulse_p90": 48.35}   // last horizon (+6); null without forecast
    }
  ]
}
```

The web app uses the company rows only for their identifiers (the product is
single-company); every other block feeds the method page.

## `companies/<company_id>.json`

Monthly history with the breakdown by variable and contribution, the forecast
made at the last month for +1..+6 and the signals
found in the history.

```jsonc
{
  "company_id": "COMP_0001",
  "group_id": "GROUP_0147",
  "months_observed": 8,
  "month": "2026-08",
  "pulse": 32.77, "pulse_prev": 17.88, "confidence": 0.82,
  "pillars": {"liquidez": 34.3, "deuda": 34.0, "pago": 51.1, "cobro": 54.6},
  "series": [
    {
      "month": "2026-01",
      "pulse": 64.81,               // weighted mean of the known variables, 0-100
      "confidence": 0.68,
      "pillars": {"liquidez": 78.3, "deuda": 100.0, "pago": 71.5, "cobro": 32.4},
      "variables": {                // one entry per variable
        "cash_days": {"score": 78.0, "raw": 160.4, "known": true},
        "loc_util":  {"score": null, "raw": null, "known": false}   // no data: neither adds nor subtracts
      },
      "contributions": {"cash_days": 13.8, "cash_min": 16.2, "...": 0},  // points of PULSE per variable; they sum to pulse
      "cash_end": 35234.07
    }
  ],
  "forecast": [
    {
      "horizon": 1,                 // months ahead
      "target_month": "2026-09",
      "pulse_pred": 32.47, "pulse_p10": 19.18, "pulse_p90": 46.85,   // prediction and 10-90 band
      "delta": -0.17,               // predicted change of PULSE; the contributions sum to delta
      "contributions": {"cash_days": 0.37, "...": 0, "contexto": -0.41, "base": -0.64}
    }
    // ... horizons 2 to 6
  ],
  "signals": [                      // oldest first; empty when the company never moved
    {
      "month": "2026-04",
      "kind": "caida",              // caida | bache | mejora | repunte
      "direction": "down",
      "level": 31.2, "baseline": 45.8, "move": -14.6, "breadth": 3, "confidence": 0.82,
      "pillar_deltas": {"liquidez": -22.1, "deuda": -4.0, "pago": 0.5, "cobro": -9.3},
      "drivers": [{"key": "cash_min", "label": "Mínimo intramensual de caja", "delta": -31.0}],
      "p_persistent": 0.71,
      "outcome": "persistente",     // persistente | transitorio | null while open
      "headline": "Caída de 15 puntos en abril de 2026",
      "detail": "..."
    }
  ]
}
```

## `details/<company_id>.json`

What is **behind** each of the 11 variables at the company's last observed
month: who, how much and since when. The eleven keys are always present; a
company without that data (no ERP, no lines) receives the block with empty
lists and `null` figures. Rankings hold at most 8 rows; `months` holds the last
12 observed months with the same figures as the score page.

```jsonc
{
  "company_id": "COMP_0001",
  "month": "2026-08",
  "variables": {
    "cash_days": {
      "daily": [{"day": "2026-07-01", "balance": 14242.42}],      // 62 days up to the month end, ascending
      "daily_outflow": 2636.46,                                   // outflow_3m / 90
      "accounts": [{"product_id": "PRODUCT_03496", "label": "CHECKING_01", "bank": "iberCaja", "type": "checking", "balance": 36300.52}],
      "months": [{"month": "2026-08", "cash_end": 36982.49, "outflow_3m": 237281.5, "cash_days": 14.03}]
    },
    "cash_min":   {"daily": [], "months": [{"month": "2026-08", "cash_end": 0, "cash_min": 0, "outflow": 0, "ratio": 0}], "min_day": {"day": "2026-08-02", "balance": 8888.36}},
    "loc_util":   {"lines": [{"product_id": "PRODUCT_07080", "label": "LINEOFCREDIT_03", "bank": "Banca March", "type": "lineofcredit", "limit": 1000000.0, "drawn": 977691.03, "util": 0.98}],
                   "months": [{"month": "2026-08", "drawn": 0, "limit": 0, "util": 0}]},
    "loc_accel":  {"months": [{"month": "2026-08", "util": 0, "util_d3": 0, "accel": 0}]},
    "dpo":        {"suppliers": [{"counterparty_id": "COUNTERPARTY_09820", "paid_3m": 43560.0, "invoices": 3, "dpo_days": 10.0, "terms_days": 30.0, "late_days": -20.0}],
                   "months": [{"month": "2026-08", "dpo_days": 0, "dpo_d3": 0}]},
    "terms":      {"suppliers": [{"counterparty_id": "COUNTERPARTY_09820", "billed_6m": 95351.29, "invoices": 7, "terms_days": 30.0}],
                   "months": [{"month": "2026-08", "terms_days": 0, "terms_d6": 0}]},
    "dso":        {"customers": [{"counterparty_id": "COUNTERPARTY_03903", "collected_3m": 197447.68, "invoices": 21, "dso_days": 31.74, "terms_days": 0.0, "late_days": 31.74}],
                   "months": [{"month": "2026-08", "dso_days": 0}]},
    "ar90":       {"aging": [{"bucket": "al_dia", "amount": 0.0, "invoices": 0}],   // always al_dia, 1_30, 31_60, 61_90, mas_90
                   "debtors": [{"counterparty_id": "COUNTERPARTY_03903", "open": 120662.52, "over_90": 26983.0, "share_over_90": 0.22}],
                   "months": [{"month": "2026-08", "open": 0, "over_90": 0, "share": 0}]},
    "top_client": {"customers": [{"counterparty_id": "COUNTERPARTY_03903", "billed_3m": 136902.53, "billed_prev_3m": 216231.17, "growth": -0.37, "share_12m": 0.83, "top": true}],
                   "months": [{"month": "2026-08", "top_counterparty_id": "COUNTERPARTY_03903", "growth": 0}]},
    "maturities": {"products": [{"product_id": "PRODUCT_07846", "label": "LOAN_01", "type": "loan", "bank": "Banco Sabadell", "outstanding": 3610098.62, "next_payment_date": null, "periods_left": null}],
                   "months": [{"month": "2026-08", "debt_service": 0, "service_3m": 0, "cash_end": 0, "ratio": 0}]},
    "network":    {"customers": [{"counterparty_id": "COUNTERPARTY_03903", "billed_6m": 353133.7, "share": 0.69, "health": 0.0, "health_d3": 0.0, "n_companies": 1}],
                   "months": [{"month": "2026-08", "exposure": 0, "customers": 0}]}
  }
}
```

| variable | ranking / table (max 8, sorted by) | `months` (last 12) |
|---|---|---|
| `cash_days` | `accounts`: every cash account at the month end (balance) · `daily`: 62 days of company cash · `daily_outflow` = `outflow_3m`/90 | `cash_end`, `outflow_3m`, `cash_days` |
| `cash_min` | the same `daily` series · `min_day`: lowest day of the month (earliest day on a tie) | `cash_end`, `cash_min`, `outflow`, `ratio` |
| `loc_util` | `lines`: every credit line with `limit`, `drawn`, `util` (util) | `drawn`, `limit`, `util` |
| `loc_accel` | — | `util`, `util_d3`, `accel` |
| `dpo` | `suppliers`: invoices paid in the trailing quarter, `dpo_days`/`terms_days` value-weighted and `late_days` their difference (`paid_3m`) | `dpo_days`, `dpo_d3` |
| `terms` | `suppliers`: invoices issued in the trailing half year with the granted `terms_days` (`billed_6m`) | `terms_days`, `terms_d6` |
| `dso` | `customers`: invoices settled in the trailing quarter (`collected_3m`) | `dso_days` |
| `ar90` | `aging`: the five buckets by days past due at the month end · `debtors`: `open`, `over_90`, `share_over_90` (over_90, then open) | `open`, `over_90`, `share` |
| `top_client` | `customers`: `billed_3m` vs `billed_prev_3m`, `growth` clipped ±1, `share_12m`, and `top` on the one the variable tracks (yearly billing) | `top_counterparty_id`, `growth` |
| `maturities` | `products`: every debt product with `outstanding` and, when `debt_schedule_config` has it, `next_payment_date` and `periods_left` (outstanding) | `debt_service`, `service_3m`, `cash_end`, `ratio` |
| `network` | `customers`: the customers that entered the variable that month, with `health`, `health_d3`, `n_companies` and their `share` of the 6-month billing (billed_6m) | `exposure`, `customers` |

Amounts on credit lines and debt products come from the product tables in
their own currency, exactly as the score reads them (99 % are in EUR).

## `recommendations/catalogue.json`

Product catalogue with spread bands, pricing parameters and the risk model's
evaluation. No company rows.

```jsonc
{
  "generated_for": "HackSpain 2026 · Embat PULSE Advisor",
  "reference_rate": {"label": "Euríbor 12 m", "value": 0.021},
  "pricing_parameters": {
    "max_risk_premium_bps": 900, "max_data_uncertainty_bps": 75,
    "stress_to_default": 0.25, "trend_decline_bps": 25, "trend_improve_bps": -15,
    "min_confidence_for_credit": 0.25
  },
  "products": [
    {
      "key": "credit_line", "label_es": "Línea de crédito", "family": "circulante",
      "what_es": "Póliza de la que dispones solo cuando la caja lo necesita; ...",
      "rate_kind": "cost", "base_spread_bps": 150, "lgd": 0.45,
      "min_spread_bps": 40, "max_spread_bps": 990, "tenor_months": 12,
      "dataset_type": "lineofcredit"
    }
    // ... 7 products
  ],
  "risk_model": {
    "rows": 14514, "stress_rate": 0.224, "oof_auroc": 0.871, "mean_predicted": 0.223,
    "coefficients_std": {"pillar_liquidez": -1.91, "pillar_deuda": -0.15, "pillar_pago": 0.0,
                         "pillar_cobro": -0.10, "confidence": -0.03, "log_months": -0.36}
  }
}
```

## `recommendations/companies/<company_id>.json`

Full explainable recommendation of one company: risk, products offered with
reasons, sizing, price breakdown and levers; products declined with the reason;
and the improvement plan.

```jsonc
{
  "company_id": "COMP_0001", "month": "2026-08",
  "pulse": 32.77, "confidence": 0.82,
  "pillars": {"liquidez": 34.3, "deuda": 34.0, "pago": 51.1, "cobro": 54.6},
  "reference_rate": {"label": "Euríbor 12 m", "value": 0.021, "source": "default"},
  "summary": "PULSE 33 (2026-08), cobertura de datos 82%: 3 producto(s) encajan con tu situación.",

  "risk": {
    "p_stress_6m": 0.28,
    "base_rate": 0.22,                       // portfolio average
    "contributions": [                       // each input's share of the logit
      {"feature": "pillar_liquidez", "label": "Pilar liquidez", "value": 34.3, "logit": 1.11}
    ]
  },

  "recommendations": [                       // up to 3, ordered by rank
    {
      "rank": 1, "product": "credit_line", "label": "Línea de crédito", "family": "circulante",
      "what": "Póliza de la que dispones solo cuando la caja lo necesita; ...",
      "fit": 75.0,
      "amount": 25000.0, "tenor_months": 12, "monthly_instalment": null,   // instalment only on loans
      "rate_kind": "cost", "annual_rate": 0.0917, "spread_bps": 707,
      "headline": "Línea de crédito de 25.000 € a 12 meses, a un tipo del 9.17% anual.",
      "why": ["Tu caja a cierre de mes cubre solo 14 días de pagos operativos (umbral 30).", "..."],
      "reasons": [
        {"code": "caja_corta", "text": "...", "kind": "pro",       // pro | contra | bloqueo
         "points": 25, "variable": "cash_days", "value": 14.0, "unit": "días"}
      ],
      "sizing": {"formula": "0.35 meses de pagos operativos (79.094 €/mes, PULSE 33) menos ...",
                 "inputs": {"cover_months": 0.35, "monthly_outflow": 79093.67, "...": 0}},
      "pricing": {
        "components": [                      // they sum to the annual rate in bps
          {"key": "referencia", "label": "Euríbor 12 m", "bps": 210, "detail": "..."},
          {"key": "margen_producto", "label": "Margen del producto", "bps": 150, "detail": "..."},
          {"key": "prima_riesgo", "label": "Prima de riesgo", "bps": 544, "detail": "..."},
          {"key": "incertidumbre_datos", "label": "Prima por incertidumbre de datos", "bps": 13, "detail": "..."}
        ],
        "clamped": false,                    // true when the spread hit the product's band
        "reference_rate": 0.021,
        "spread_band_bps": [40, 990],
        "annual_pd": 0.48, "expected_loss_bps": 544,
        "story": ["Euríbor 12 m: +210 pb ...", "..."]
      },
      "levers": [                            // what would happen if a pillar rose to 60
        {"pillar": "liquidez", "label": "Pilar liquidez", "current": 34.3, "target": 60.0,
         "p_stress_now": 0.28, "p_stress_then": 0.07, "premium_saving_bps": 395,
         "variables": [{"key": "cash_min", "label": "Mínimo intramensual de caja",
                        "score": 30.4, "raw": 0.11, "weight": 14}]}
      ],
      "lever_story": ["Si tu pilar de liquidez subiera de 34 a 60, la prima bajaría 395 pb; ..."]
    }
  ],

  "declined": [                              // products not offered and why
    {"product": "credit_line_increase", "label": "Ampliación de línea de crédito",
     "status": "no_elegible", "reasons": ["No tienes ninguna línea de crédito que ampliar."]}
  ],

  "improvement_plan": {                      // the answer for companies with no product today
    "unlocks": ["Préstamo a plazo: se desbloquea con un PULSE de 60 (hoy 33)."],
    "levers": [ /* same shape as recommendations[].levers */ ],
    "story": ["..."]
  },

  "inputs": {                                // magnitudes the rules used
    "cash_end": 36982.49, "monthly_outflow": 79093.67, "monthly_collections": 69331.21,
    "service_3m": 30.0, "pulse_d3": -1.83,
    "holdings": {"types": [], "line_limit": 0.0, "line_drawn": 0.0,
                 "loan_outstanding": 0.0, "n_loans": 0, "current_rate": null},
    "invoices": {"has_erp": true, "open_ar": 156000.46, "eligible_ar": 154880.0,
                 "ar_monthly": 98481.73, "open_ap": 177750.31, "ap_monthly": 63035.89},
    "outlook": {"pulse_pred": 31.07, "pulse_p10": 15.58, "pulse_p90": 48.35},
    "variables": {"cash_days": {"score": 39.0, "raw": 14.0, "known": true, "source": "primary"},
                  "loc_util": {"score": null, "raw": null, "known": false, "source": null}}
  },
  "disclaimer": "Propuesta orientativa ..."
}
```

The narrative fields (`what`, `why`, `headline`, `story`, `summary`,
`disclaimer`, signal `headline`/`detail`) are written in Spanish because that
is the language of the product; keys and enumerations are stable identifiers.

## `manifest.json`

```jsonc
{
  "generated_at": "2026-09-19T23:10:04+00:00",
  "mode": "train",                  // train | frozen | export-only
  "raw_dir": "/…/data/raw/xray",
  "work_dir": "/…/data/pulse",
  "last_month": "2026-08",
  "companies": 1285,
  "files": {"companies": 1285, "details": 1285, "recommendations": 1285},
  "reports": ["cleaning_report.json", "cleaning_report.md", "evaluation.json", "..."]
}
```

## Intermediate artefacts (work dir, not part of the contract)

`data/pulse/` also keeps what the steps hand to each other: `panel.parquet`,
`clean_transactions.parquet`, `scored_panel.parquet`, `forecast_frame.parquet`,
`forecast.{parquet,csv}`, `signals.parquet`, `recommendations/summary.json`
(the portfolio rows) and `recommendations/snapshots.json` (the inputs of every
recommendation), plus the frozen models under `models/`. `pulse_scores.csv`
is the flat per-month score written by the standalone `pulse.cli score`
command.
