# API HTTP del backend — referencia de endpoints

Referencia de la API FastAPI que vive en `src/ml_service/api/`.
Es el **contrato entre apps**: todo lo que renderiza `../frontend` sale de aquí.
Para el detalle de los modelos (PULSE, Advisor) ver [`README.md`](./README.md).

- Base URL local: `http://localhost:8000` (`make api-dev`).
- Swagger interactivo: `/docs` · esquema OpenAPI: `/openapi.json`.
- Todas las respuestas son JSON.
- Todos los endpoints son `GET` y no necesitan autenticación.
- Los ids de empresa tienen la forma `COMP_0001`; los meses, `YYYY-MM`.

## Índice

| Bloque | Método | Ruta | Qué devuelve |
|---|---|---|---|
| Meta | GET | [`/health`](#get-health) | Estado del servicio |
| PULSE | GET | [`/api/pulse/summary`](#get-apipulsesummary) | Definición del score + PULSE actual de cada empresa |
| PULSE | GET | [`/api/pulse/companies/{company_id}`](#get-apipulsecompaniescompany_id) | Serie mensual PULSE + forecast 6 meses |
| PULSE | GET | [`/api/pulse/companies/{company_id}/details`](#get-apipulsecompaniescompany_iddetails) | Detalle por variable: contrapartes, cuentas, líneas y aging |
| Advisor | GET | [`/api/pulse/recommendations/catalogue`](#get-apipulserecommendationscatalogue) | Catálogo de productos y parámetros de pricing |
| Advisor | GET | [`/api/pulse/recommendations`](#get-apipulserecommendations) | Recomendación top de cada empresa |
| Advisor | GET | [`/api/pulse/recommendations/{company_id}`](#get-apipulserecommendationscompany_id) | Recomendación completa y explicable |

## Convenciones

### Errores

Siempre JSON con la forma `{"detail": "<mensaje>"}`:

| Código | Cuándo |
|---|---|
| `404` | Empresa desconocida, o fichero de export no generado (PULSE / Advisor) |
| `422` | Query no válida (validación automática de FastAPI) |

### Configuración

| Variable | Por defecto | Uso |
|---|---|---|
| `PULSE_DATA_DIR` | `backend/data` | Raíz de artefactos (`pulse/web`, `pulse/recommendations`) |
| `PULSE_CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Orígenes permitidos, separados por comas |
| `PORT` | `8000` | Puerto del contenedor / `python -m ml_service.api` |

### Valores enumerados

| Campo | Valores |
|---|---|
| Pilares PULSE | `liquidez` · `deuda` · `cobro` · `pago` |
| Variables PULSE | `cash_days` · `cash_min` · `loc_util` · `loc_accel` · `dpo` · `terms` · `dso` · `ar90` · `top_client` · `maturities` · `network` |
| Productos Advisor | `credit_line` · `credit_line_increase` · `factoring` · `confirming` · `term_loan` · `refinancing` · `treasury_deposit` |
| `rate_kind` | `cost` (la empresa paga) · `yield` (la empresa cobra, depósito) |

---

## Meta

### `GET /health`

Comprueba que el servicio está vivo y qué ha cargado. Es el health check de Fly/Docker.

**Envía:** nada.

**Recibe:**

```jsonc
{
  "status": "ok",                       // "degraded" si no existe el export PULSE
  "n_companies": 1286,                  // empresas en pulse/web/summary.json
  "last_month": "2026-08",              // último mes puntuado, o null
  "recommendations_loaded": true        // true si existe el export del Advisor
}
```

---

## PULSE (score 0-100 transparente, 11 variables)

Estos endpoints sirven ficheros estáticos escritos por `ml_service.pulse.export_web` en `<PULSE_DATA_DIR>/pulse/web/`. Si no se ha ejecutado el export devuelven `404`.

### `GET /api/pulse/summary`

Definición del score (pilares, variables, pesos, horizontes de forecast) y una fila por empresa con su PULSE más reciente.

**Envía:** nada.

**Recibe:**

```jsonc
{
  "generated_for": "HackSpain 2026 · Embat PULSE",
  "score_name": "PULSE",
  "score_expansion": "Payment, Underwriting, Liquidity & Solvency Estimate",
  "horizons": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],   // meses de forecast disponibles
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
    // ... 11 en total
  ],
  "contribution_keys": ["cash_days", "cash_min", "...", "network", "contexto", "base"],
  "companies": [
    {
      "company_id": "COMP_0001",
      "group_id": "GROUP_0147",
      "months_observed": 8,
      "pulse": 32.77,                             // PULSE actual (percentil 0-100)
      "pulse_prev": 17.88,
      "confidence": 0.82,                         // parte del score respaldada por datos, 0-1
      "pillars": {"liquidez": 34.3, "deuda": 34.0, "pago": 51.1, "cobro": 54.6},
      "forecast_12m": {"pulse_pred": 31.07, "pulse_p10": 15.58, "pulse_p90": 48.35}   // previsión a un año (último horizonte)
    }
  ]
}
```

### `GET /api/pulse/companies/{company_id}`

Historia mensual del PULSE de una empresa, con el desglose por variable y contribución, y el forecast a 1..6 meses.

**Envía:** `company_id` en la ruta.

**Recibe:**

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
      "pulse": 64.81,               // media ponderada de las variables con datos, 0-100
      "confidence": 0.68,
      "pillars": {"liquidez": 78.3, "deuda": 100.0, "pago": 71.5, "cobro": 32.4},
      "variables": {                // una entrada por variable
        "cash_days": {"score": 78.0, "raw": 160.4, "known": true},
        "loc_util":  {"score": null, "raw": null, "known": false}   // sin datos: no suma ni resta
      },
      "contributions": {"cash_days": 13.8, "cash_min": 16.2, "...": 0},  // puntos de PULSE por variable; suman pulse
      "cash_end": 35234.07
    }
  ],
  "forecast": [
    {
      "horizon": 1,                 // meses hacia delante
      "target_month": "2026-09",
      "pulse_pred": 32.47, "pulse_p10": 19.18, "pulse_p90": 46.85,   // predicción y banda 10-90
      "delta": -0.17,               // cambio previsto de PULSE; las contribuciones suman delta
      "contributions": {"cash_days": 0.37, "...": 0, "contexto": -0.41, "base": -0.64}
    }
    // ... horizontes 2 a 12
  ]
}
```

**Errores:** `404` si no existe `pulse/web/companies/<id>.json`.

---

### `GET /api/pulse/companies/{company_id}/details`

Lo que hay **detrás** de cada una de las 11 variables en el último mes observado de la empresa (2026-08): quién, cuánto y desde cuándo. Sirve los ficheros de `pulse/web/details/` que escribe `ml_service.pulse.export_details` (ver [README](./README.md#detail-behind-each-variable-pulseexport_detailspy)).

**Envía:** `company_id` en la ruta.

**Recibe:** las once claves de `variables` siempre están presentes; una empresa sin ese dato (sin ERP, sin líneas) recibe el bloque con listas vacías y cifras `null`. Importes en EUR redondeados a 2 decimales, rankings de 8 filas como máximo, `months` con los 12 últimos meses observados (las mismas cifras que la página del score).

```jsonc
{
  "company_id": "COMP_0001",
  "month": "2026-08",
  "variables": {
    "cash_days": {
      "daily": [{"day": "2026-07-01", "balance": 14242.42}],      // 62 días hasta el fin de mes, ascendente
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
    "ar90":       {"aging": [{"bucket": "al_dia", "amount": 0.0, "invoices": 0}],   // siempre al_dia, 1_30, 31_60, 61_90, mas_90
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

**Errores:** `404` si no existe `pulse/web/details/<id>.json`.

---

## PULSE Advisor (recomendación de productos financieros)

Sirve los ficheros de `<PULSE_DATA_DIR>/pulse/recommendations/` escritos por `ml_service.pulse.recommend.cli build`. Los tres endpoints aceptan `?euribor=` para re-cotizar en caliente sobre otro tipo sin riesgo.

| Parámetro común | Tipo | Descripción |
|---|---|---|
| `euribor` | float, de −0.01 a 0.25 | Tipo de referencia anual en decimal (`0.03` = 3 %). Si se envía, la recomendación se recalcula con ese tipo y `reference_rate.source` pasa a `"request"`. Los diferenciales, importes, razones y palancas no cambian; sí el tipo final, el `headline` y la historia de precio. |

### `GET /api/pulse/recommendations/catalogue`

Catálogo de productos con sus bandas de diferencial, parámetros de pricing y evaluación del modelo de riesgo. Sin filas de empresas.

**Envía:** nada.

**Recibe:**

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
    // ... 7 productos
  ],
  "risk_model": {
    "rows": 14514, "stress_rate": 0.224, "oof_auroc": 0.871, "mean_predicted": 0.223,
    "coefficients_std": {"pillar_liquidez": -1.91, "pillar_deuda": -0.15, "pillar_pago": 0.0,
                         "pillar_cobro": -0.10, "confidence": -0.03, "log_months": -0.36}
  }
}
```

### `GET /api/pulse/recommendations`

Una fila por empresa con su recomendación principal, ordenadas por `top_fit` descendente.

**Envía (query, opcionales):**

| Parámetro | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `product` | string | — | Solo empresas cuyo producto top es este (ver enumerados) |
| `limit` | int 1-2000 | `100` | Máximo de filas |
| `euribor` | float | — | Re-cotiza (ver arriba) |

**Recibe:**

```jsonc
{
  "items": [
    {
      "company_id": "COMP_0001",
      "month": "2026-08",
      "pulse": 32.77,
      "confidence": 0.82,
      "p_stress_6m": 0.28,          // probabilidad de tensión a 6 meses
      "n_recommended": 3,           // productos ofrecidos
      "top_product": "credit_line", // null si no se ofrece nada
      "top_label": "Línea de crédito",
      "top_amount": 25000.0,
      "top_annual_rate": 0.0917,    // tipo anual final (decimal)
      "top_spread_bps": 707,
      "top_rate_kind": "cost",
      "top_fit": 75.0,              // encaje 0-100
      "headline": "Línea de crédito de 25.000 € a 12 meses, a un tipo del 9.17% anual."
    }
  ],
  "total": 1285,                    // filas tras el filtro de producto
  "limit": 100,
  "by_top_product": {"credit_line": 365, "treasury_deposit": 152, "...": 0, "ninguno": 515},  // siempre sobre toda la cartera
  "reference_rate": {"label": "Euríbor 12 m", "value": 0.021, "source": "default"}
}
```

### `GET /api/pulse/recommendations/{company_id}`

Recomendación completa y explicable de una empresa: riesgo, productos ofrecidos con razones, dimensionado, desglose de precio y palancas; productos descartados con el porqué; y plan de mejora.

**Envía:** `company_id` en la ruta; `euribor` opcional en query.

**Recibe:**

```jsonc
{
  "company_id": "COMP_0001", "month": "2026-08",
  "pulse": 32.77, "confidence": 0.82,
  "pillars": {"liquidez": 34.3, "deuda": 34.0, "pago": 51.1, "cobro": 54.6},
  "reference_rate": {"label": "Euríbor 12 m", "value": 0.021, "source": "default"},
  "summary": "PULSE 33 (2026-08), cobertura de datos 82%: 3 producto(s) encajan con tu situación.",

  "risk": {
    "p_stress_6m": 0.28,
    "base_rate": 0.22,                       // tasa media de la cartera
    "contributions": [                       // aporte de cada input al logit
      {"feature": "pillar_liquidez", "label": "Pilar liquidez", "value": 34.3, "logit": 1.11}
    ]
  },

  "recommendations": [                       // hasta 3, ordenadas por rank
    {
      "rank": 1, "product": "credit_line", "label": "Línea de crédito", "family": "circulante",
      "what": "Póliza de la que dispones solo cuando la caja lo necesita; ...",
      "fit": 75.0,
      "amount": 25000.0, "tenor_months": 12, "monthly_instalment": null,   // cuota solo en préstamos
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
        "components": [                      // suma = tipo anual en pb
          {"key": "referencia", "label": "Euríbor 12 m", "bps": 210, "detail": "..."},
          {"key": "margen_producto", "label": "Margen del producto", "bps": 150, "detail": "..."},
          {"key": "prima_riesgo", "label": "Prima de riesgo", "bps": 544, "detail": "..."},
          {"key": "incertidumbre_datos", "label": "Prima por incertidumbre de datos", "bps": 13, "detail": "..."}
        ],
        "clamped": false,                    // true si el diferencial tocó la banda del producto
        "reference_rate": 0.021,
        "spread_band_bps": [40, 990],
        "annual_pd": 0.48, "expected_loss_bps": 544,
        "story": ["Euríbor 12 m: +210 pb ...", "..."]
      },
      "levers": [                            // qué pasaría si un pilar subiera a 60
        {"pillar": "liquidez", "label": "Pilar liquidez", "current": 34.3, "target": 60.0,
         "p_stress_now": 0.28, "p_stress_then": 0.07, "premium_saving_bps": 395,
         "variables": [{"key": "cash_min", "label": "Mínimo intramensual de caja",
                        "score": 30.4, "raw": 0.11, "weight": 14}]}
      ],
      "lever_story": ["Si tu pilar de liquidez subiera de 34 a 60, la prima bajaría 395 pb; ..."]
    }
  ],

  "declined": [                              // productos no ofrecidos y por qué
    {"product": "credit_line_increase", "label": "Ampliación de línea de crédito",
     "status": "no_elegible", "reasons": ["No tienes ninguna línea de crédito que ampliar."]}
  ],

  "improvement_plan": {                      // respuesta para empresas sin producto hoy
    "unlocks": ["Préstamo a plazo: se desbloquea con un PULSE de 60 (hoy 33)."],
    "levers": [ /* misma forma que recommendations[].levers */ ],
    "story": ["..."]
  },

  "inputs": {                                // magnitudes usadas por las reglas
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

**Errores:** `404` si la empresa no tiene fichero de recomendación (o snapshot, cuando se usa `euribor`).

---

## Ejemplos rápidos

```bash
# Estado
curl localhost:8000/health

# Definición del score y PULSE actual de toda la cartera
curl localhost:8000/api/pulse/summary

# PULSE con forecast
curl localhost:8000/api/pulse/companies/COMP_0001

# Catálogo de productos del Advisor
curl localhost:8000/api/pulse/recommendations/catalogue

# Empresas cuya recomendación top es factoring
curl "localhost:8000/api/pulse/recommendations?product=factoring&limit=20"

# Recomendación re-cotizada con Euríbor al 3 %
curl "localhost:8000/api/pulse/recommendations/COMP_0001?euribor=0.03"
```
