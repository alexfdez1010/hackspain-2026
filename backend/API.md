# API HTTP del backend — referencia de endpoints

Referencia completa de la API FastAPI que vive en `src/ml_service/api/`.
Es el **contrato entre apps**: todo lo que renderiza `../frontend` sale de aquí.
Para el detalle de los modelos (X-Ray, PULSE, Advisor) ver [`README.md`](./README.md).

- Base URL local: `http://localhost:8000` (`make api-dev`).
- Swagger interactivo: `/docs` · esquema OpenAPI: `/openapi.json`.
- Todas las respuestas son JSON salvo `GET /api/submission.csv` (`text/csv`).
- Todos los endpoints son `GET` y no necesitan autenticación, excepto los dos
  `POST /api/score*`, que piden API key si `XRAY_API_KEY` está configurada.
- Los ids de empresa tienen la forma `COMP_0001`; los meses, `YYYY-MM`.

## Índice

| Bloque | Método | Ruta | Qué devuelve |
|---|---|---|---|
| Meta | GET | [`/health`](#get-health) | Estado del servicio |
| Meta | GET | [`/api/meta`](#get-apimeta) | Etiquetas de pilares/variables + evaluación |
| X-Ray | GET | [`/api/companies`](#get-apicompanies) | Listado paginado de empresas (sin series) |
| X-Ray | GET | [`/api/companies/{company_id}`](#get-apicompaniescompany_id) | Ficha completa: series, alertas, explicación, oferta |
| X-Ray | GET | [`/api/movers`](#get-apimovers) | Mayores subidas y bajadas de score |
| X-Ray | GET | [`/api/alerts`](#get-apialerts) | Alertas filtradas |
| X-Ray | GET | [`/api/alerts/counts`](#get-apialertscounts) | Conteo de alertas por tipo / severidad / mes |
| X-Ray | GET | [`/api/offers`](#get-apioffers) | Oferta de circulante de cada empresa + totales |
| X-Ray | GET | [`/api/offers/{company_id}`](#get-apiofferscompany_id) | Oferta actual + histórico 12 meses |
| X-Ray | POST | [`/api/score`](#post-apiscore) | Puntúa un ZIP con los CSV del reto |
| X-Ray | POST | [`/api/score/path`](#post-apiscorepath) | Puntúa una carpeta ya presente en el servidor |
| X-Ray | GET | [`/api/submission.csv`](#get-apisubmissioncsv) | CSV de submission del set de entrenamiento |
| PULSE | GET | [`/api/pulse/summary`](#get-apipulsesummary) | Definición del score + PULSE actual de cada empresa |
| PULSE | GET | [`/api/pulse/companies/{company_id}`](#get-apipulsecompaniescompany_id) | Serie mensual PULSE + forecast 6 meses |
| Advisor | GET | [`/api/pulse/recommendations/catalogue`](#get-apipulserecommendationscatalogue) | Catálogo de productos y parámetros de pricing |
| Advisor | GET | [`/api/pulse/recommendations`](#get-apipulserecommendations) | Recomendación top de cada empresa |
| Advisor | GET | [`/api/pulse/recommendations/{company_id}`](#get-apipulserecommendationscompany_id) | Recomendación completa y explicable |

## Convenciones

### Errores

Siempre JSON con la forma `{"detail": "<mensaje>"}`:

| Código | Cuándo |
|---|---|
| `400` | Subida vacía / ZIP inválido / faltan tablas / carpeta inexistente |
| `401` | Falta o no coincide la API key en `POST /api/score*` |
| `404` | Empresa desconocida, o fichero de export no generado (PULSE / Advisor) |
| `413` | ZIP mayor de 200 MB |
| `422` | Query o body no válidos (validación automática de FastAPI) |
| `503` | Artefactos no cargados (store vacío o `data/models` ausente) |

### Autenticación (solo `POST`)

Si el proceso arranca con `XRAY_API_KEY=<clave>`, los `POST` exigen una de estas cabeceras:

```
Authorization: Bearer <clave>
X-API-Key: <clave>
```

Sin la variable de entorno, los `POST` están abiertos.

### Configuración

| Variable | Por defecto | Uso |
|---|---|---|
| `XRAY_DATA_DIR` | `backend/data` | Raíz de artefactos (`output/web`, `models`, `pulse/web`, `pulse/recommendations`) |
| `XRAY_CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Orígenes permitidos, separados por comas |
| `XRAY_API_KEY` | *(vacío)* | Activa la API key en los `POST` |
| `PORT` | `8000` | Puerto del contenedor / `python -m ml_service.api` |

### Valores enumerados

| Campo | Valores |
|---|---|
| `direction` | `improving` · `stable` · `deteriorating` |
| `regime` | `steady` · `structural_decline` · `structural_improvement` · `transient_dip` · `transient_spike` |
| Alerta `type` | `liquidity_squeeze` · `payment_stress` · `score_drop` · `improvement` · `stress_risk_high` · `structural_decline` |
| Alerta `severity` | `critical` · `warning` · `info` |
| Oferta `status` | `preaprobada` · `en_vigilancia` · `cerrada` |
| Pilares X-Ray | `liquidity` · `cashflow` · `payments` · `receivables` · `debt` · `activity` |
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
  "status": "ok",                       // "degraded" si no hay empresas cargadas
  "n_companies": 1286,
  "models_loaded": true,                // true si existe data/models con los boosters
  "generated_at": "2026-09-18T18:27:05+00:00"   // fecha del export web, o null
}
```

### `GET /api/meta`

Etiquetas en español para pintar pilares y variables de X-Ray, más los informes de evaluación y anticipación.

**Envía:** nada.

**Recibe:**

```jsonc
{
  "pillar_labels":  {"liquidity": "Liquidez", "cashflow": "Flujo de caja", "...": "..."},
  "feature_labels": {"cash_runway_months": "Meses de caja disponibles", "...": "..."},
  "evaluation":   { /* contenido de data/output/evaluation.json, o null */ },
  "anticipation": { /* n_companies, early_warning_types, lead_time{...}, detection_rate{...}, o null */ }
}
```

---

## X-Ray (score 0-100 con ML)

### `GET /api/companies`

Listado paginado de empresas con su score actual, **sin** la serie mensual. Pensado para tablas y filtros.

**Envía (query, todos opcionales):**

| Parámetro | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `direction` | string | — | Filtra por dirección (ver enumerados) |
| `regime` | string | — | Filtra por régimen |
| `min_score` | float | — | Score mínimo inclusive |
| `max_score` | float | — | Score máximo inclusive |
| `q` | string | — | Búsqueda por subcadena en `company_id` (no distingue mayúsculas) |
| `sort` | string | `-score` | `score`, `p_stress`, `trend_6m` o `company_id`; prefijo `-` para descendente. Clave desconocida → `-score` |
| `limit` | int 1-500 | `50` | Tamaño de página |
| `offset` | int ≥ 0 | `0` | Desplazamiento |

**Recibe:**

```jsonc
{
  "items": [
    {
      "company_id": "COMP_1136",
      "group_id": "GROUP_0222",
      "months_observed": 22,
      "score": 96.74,           // score actual 0-100
      "score_prev": 96.61,      // mes anterior
      "score_6m_ago": 96.37,
      "trend_6m": 0.03,         // pendiente Theil-Sen, puntos/mes
      "direction": "stable",
      "regime": "structural_improvement",
      "p_stress": 0.0065,       // probabilidad de estrés futuro 0-1
      "pillars": {"liquidity": 80.8, "cashflow": 71.2, "payments": 64.0,
                  "receivables": 58.3, "debt": 77.9, "activity": 60.1},
      "reasons": [              // top drivers SHAP del mes actual
        {"feature": "payables_overdue_share", "label": "Facturas a proveedor vencidas",
         "pillar": "payments", "impact": -1.46, "value": 0.42}
      ]
    }
  ],
  "total": 1286,                // empresas que cumplen los filtros (antes de paginar)
  "limit": 50,
  "offset": 0,
  "totals": {                   // agregados sobre las empresas filtradas
    "n_companies": 1286,
    "avg_score": 56.29,
    "by_direction": {"improving": 518, "stable": 462, "deteriorating": 306},
    "by_regime": {"structural_improvement": 637, "steady": 239, "structural_decline": 402,
                  "transient_dip": 4, "transient_spike": 4},
    "at_risk": 138              // empresas con p_stress >= 0.5
  }
}
```

Ejemplo: `GET /api/companies?direction=deteriorating&min_score=30&sort=p_stress&limit=20`

### `GET /api/companies/{company_id}`

Ficha completa de una empresa: registro con la serie mensual, alertas, explicación del cambio de score y oferta de circulante.

**Envía:** `company_id` en la ruta (p. ej. `COMP_0001`).

**Recibe:**

```jsonc
{
  "company": {
    // mismos campos que un item de /api/companies, más:
    "series": [
      {
        "month": "2026-08",
        "score": 46.29, "score_raw": 46.29, "composite": 51.0,
        "p_stress": 0.25, "trend_6m": -5.5,
        "direction": "deteriorating", "regime": "structural_decline",
        "regime_shift": 0.0, "changepoint_month": "2026-03",
        "stress_now": 0,
        "pillars": {"liquidity": 44.2, "cashflow": 52.2, "...": 0},
        "raw": {                            // magnitudes observadas ese mes
          "inflow": 69341.2, "outflow": 62000.0, "net": 7341.2,
          "cash_end": 35234.1, "cash_min": 1200.0,
          "dso_days": 61.0, "supplier_delay_days": 12.0,
          "overdue_ar": 15000.0, "overdue_ap": 8000.0,
          "loc_utilization": 0.83, "returned_debit_n": 0, "stress_n": 0,
          "n_tx": 312, "n_counterparties": 41,
          "debt_outstanding": 120000.0, "payroll": 18000.0, "tax_paid": 4200.0
        },
        "reasons": [ /* drivers SHAP de ese mes */ ]
      }
    ]
  },
  "alerts": [                               // alertas de esta empresa (ver /api/alerts)
    {"company_id": "COMP_0001", "month": "2026-08", "type": "score_drop",
     "severity": "critical", "title_es": "Caída del score",
     "detail_es": "El score ha bajado 19 puntos en 3 meses ...",
     "score": 18.7, "delta": -18.5}
  ],
  "explanation": {                          // null si el store hizo fallback al parquet
    "month": "2026-08", "score": 46.29, "score_prev": 42.87,
    "score_ref": 75.78, "reference_month": "2026-02", "window_months": 6,
    "waterfall": [                          // qué features explican el cambio a 6 meses
      {"feature": "payables_overdue_share", "label": "Facturas a proveedor vencidas",
       "pillar": "payments", "delta_points": -7.9, "value_before": 0.17, "value_after": 0.42}
    ],
    "waterfall_1m": [ /* igual, respecto al mes anterior */ ],
    "narrative_es": "...", "narrative_1m_es": "...", "regime_text_es": "..."
  },
  "offer": { /* ver Offer en /api/offers */ }
}
```

**Errores:** `404` si la empresa no existe.

### `GET /api/movers`

Ranking de las empresas cuyo score más ha subido y más ha bajado en una ventana de meses.

**Envía (query):**

| Parámetro | Tipo | Por defecto |
|---|---|---|
| `window` | int 1-24 | `6` (meses hacia atrás) |
| `limit` | int 1-100 | `10` (por lista) |

**Recibe:**

```jsonc
{
  "window": 6,
  "improvers": [
    {"company_id": "COMP_0412", "score": 71.2, "score_then": 40.5, "delta": 30.7,
     "direction": "improving", "regime": "structural_improvement"}
  ],
  "decliners": [ /* misma forma, delta negativo */ ]
}
```

Las empresas con menos de `window + 1` meses de serie quedan fuera.

### `GET /api/alerts`

Alertas del sistema de monitorización, ordenadas de más reciente a más antigua.

**Envía (query, opcionales):**

| Parámetro | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `type` | string | — | Tipo de alerta (ver enumerados) |
| `severity` | string | — | `critical`, `warning` o `info` |
| `month` | `YYYY-MM` | — | Mes exacto |
| `limit` | int 1-1000 | `100` | Máximo de alertas devueltas (no hay `offset`) |

**Recibe:**

```jsonc
{
  "items": [
    {
      "company_id": "COMP_0013",
      "month": "2026-08",
      "type": "score_drop",
      "severity": "critical",
      "title_es": "Caída del score",
      "detail_es": "El score ha bajado 19 puntos en 3 meses (37→19) y la señal acumulada (CUSUM) ...",
      "score": 18.7,
      "delta": -18.5            // puede faltar según el tipo de alerta
    }
  ],
  "total": 1407,                // alertas que cumplen los filtros
  "limit": 100
}
```

### `GET /api/alerts/counts`

Agregados de todas las alertas, para cabeceras y gráficos.

**Envía:** nada.

**Recibe:**

```jsonc
{
  "total": 9566,
  "by_type": {"liquidity_squeeze": 3283, "improvement": 2199, "score_drop": 1407,
              "structural_decline": 1047, "stress_risk_high": 857, "payment_stress": 773},
  "by_severity": {"critical": 5789, "info": 2199, "warning": 1578},
  "by_month": {"2026-08": 525, "2026-07": 498, "...": 0}
}
```

### `GET /api/offers`

Oferta dinámica de circulante (límite + diferencial) calculada para cada empresa a partir de su score, `p_stress`, régimen y cobros medios. Ordenadas por límite descendente. La fórmula está en el README, sección *Dynamic working-capital offer*.

**Envía (query, opcionales):**

| Parámetro | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `status` | string | — | `preaprobada`, `en_vigilancia` o `cerrada` |
| `limit` | int 1-2000 | `50` | Máximo de ofertas devueltas |

**Recibe:**

```jsonc
{
  "items": [
    {
      "company_id": "COMP_0001",
      "month": "2026-08",
      "score": 69.02,
      "p_stress": 0.0276,
      "regime": "structural_improvement",
      "avg_monthly_inflow_3m": 69341.21,   // media de cobros de los últimos 3 meses
      "k": 0.92,                           // multiplicador aplicado a los cobros
      "limit": 63793.92,                   // límite ofrecido en EUR (0 si cerrada)
      "spread_bps": 283,                   // diferencial en puntos básicos
      "status": "preaprobada"
    }
  ],
  "total": 1286,
  "limit": 50,
  "totals": {                              // sobre las ofertas filtradas
    "n_offers": 1286,
    "total_limit": 54213000.0,
    "avg_limit": 42155.6,
    "avg_spread_bps": 391.4,
    "by_status": {"preaprobada": 700, "en_vigilancia": 300, "cerrada": 286}
  }
}
```

### `GET /api/offers/{company_id}`

Oferta actual de una empresa y cómo habría sido cada uno de los últimos 12 meses.

**Envía:** `company_id` en la ruta.

**Recibe:**

```jsonc
{
  "offer":   { /* Offer del mes actual, misma forma que en /api/offers */ },
  "history": [ /* hasta 12 Offer, una por mes, de más antigua a más reciente */ ]
}
```

**Errores:** `404` si la empresa no existe.

### `POST /api/score`

Puntúa un dataset nuevo (p. ej. el test oculto del reto) subido como ZIP. Construye el panel de features, aplica el motor entrenado y devuelve los registros de empresa junto al CSV de submission.

**Envía:**

- Cabecera `Authorization: Bearer <clave>` o `X-API-Key` (solo si hay `XRAY_API_KEY`).
- Body `multipart/form-data` con un campo `file` que contenga un ZIP.
- El ZIP debe incluir al menos `transactions.csv`, `balances.csv` y `companies.csv`, en la raíz o dentro de una única carpeta. Límite 200 MB.

```bash
zip -j hidden.zip /ruta/al/test_oculto/*.csv
curl -X POST http://localhost:8000/api/score \
     -H "Authorization: Bearer $XRAY_API_KEY" \
     -F file=@hidden.zip
```

**Recibe:**

```jsonc
{
  "n_companies": 120,
  "n_rows": 2400,                           // filas empresa-mes puntuadas
  "companies": [ /* misma forma que /api/companies/{id}.company, con series */ ],
  "submission_csv": "company_id,month,score,p_stress,trend_6m,direction,regime\nCOMP_0001,2024-10,70.36,0.18,NaN,improving,steady\n..."
}
```

En los registros devueltos `reasons` y `explanation` van vacíos (no se calcula SHAP en el scoring ad hoc).

**Errores:** `400` ZIP vacío/inválido/rutas inseguras/faltan tablas/panel vacío · `401` API key · `413` >200 MB · `503` sin `data/models`.

### `POST /api/score/path`

Igual que `/api/score`, pero para una carpeta que ya está en el disco del servidor. Solo tiene sentido en desarrollo local.

**Envía:**

- Misma autenticación que `/api/score`.
- Body JSON:

```json
{"raw_dir": "/ruta/a/la/carpeta/con/csv"}
```

`~` se expande. Se busca la carpeta con las tres tablas obligatorias de forma recursiva bajo `raw_dir`.

**Recibe:** el mismo `ScoreResult` que `/api/score`.

**Errores:** `400` no es un directorio o faltan tablas · `401` · `503`.

### `GET /api/submission.csv`

Descarga el CSV de submission generado sobre el set de entrenamiento.

**Envía:** nada.

**Recibe:** `text/csv` con `Content-Disposition: attachment; filename="submission.csv"`:

```
company_id,month,score,p_stress,trend_6m,direction,regime
COMP_0001,2024-10,70.3649,0.1832,NaN,improving,steady
```

**Errores:** `404` si no existe `data/output/submission.csv`.

---

## PULSE (score 0-100 transparente, 11 variables)

Estos endpoints sirven ficheros estáticos escritos por `ml_service.pulse.export_web` en `<XRAY_DATA_DIR>/pulse/web/`. Si no se ha ejecutado el export devuelven `404`.

### `GET /api/pulse/summary`

Definición del score (pilares, variables, pesos, horizontes de forecast) y una fila por empresa con su PULSE más reciente.

**Envía:** nada.

**Recibe:**

```jsonc
{
  "generated_for": "HackSpain 2026 · Embat PULSE",
  "score_name": "PULSE",
  "score_expansion": "Payment, Underwriting, Liquidity & Solvency Estimate",
  "horizons": [1, 2, 3, 4, 5, 6],                 // meses de forecast disponibles
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
      "forecast_6m": {"pulse_pred": 31.07, "pulse_p10": 15.58, "pulse_p90": 48.35}
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
      "pulse": 69.93,               // percentil en la población de entrenamiento
      "pulse_raw": 64.81,           // media ponderada de variables antes de calibrar
      "confidence": 0.68,
      "pillars": {"liquidez": 78.3, "deuda": 100.0, "pago": 71.5, "cobro": 32.4},
      "variables": {                // una entrada por variable
        "cash_days": {"score": 78.0, "raw": 160.4, "known": true},
        "loc_util":  {"score": null, "raw": null, "known": false}   // sin datos: no suma ni resta
      },
      "contributions": {"cash_days": 13.8, "cash_min": 16.2, "...": 0},  // puntos de pulse_raw por variable
      "cash_end": 35234.07
    }
  ],
  "forecast": [
    {
      "horizon": 1,                 // meses hacia delante
      "target_month": "2026-09",
      "pulse_pred": 32.47, "pulse_p10": 19.18, "pulse_p90": 46.85,   // predicción y banda 10-90
      "delta_raw": -0.17,           // cambio previsto de pulse_raw
      "contributions": {"cash_days": 0.37, "...": 0, "contexto": -0.41, "base": -0.64}
    }
    // ... horizontes 2 a 6
  ]
}
```

**Errores:** `404` si no existe `pulse/web/companies/<id>.json`.

---

## PULSE Advisor (recomendación de productos financieros)

Sirve los ficheros de `<XRAY_DATA_DIR>/pulse/recommendations/` escritos por `ml_service.pulse.recommend.cli build`. Los tres endpoints aceptan `?euribor=` para re-cotizar en caliente sobre otro tipo sin riesgo.

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
    "service_3m": 30.0, "pulse_raw_d3": -1.83,
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

# 20 empresas en deterioro con mayor probabilidad de estrés
curl "localhost:8000/api/companies?direction=deteriorating&sort=-p_stress&limit=20"

# Ficha completa
curl localhost:8000/api/companies/COMP_0001

# Alertas críticas de agosto
curl "localhost:8000/api/alerts?severity=critical&month=2026-08"

# Oferta de circulante e histórico
curl localhost:8000/api/offers/COMP_0001

# PULSE con forecast
curl localhost:8000/api/pulse/companies/COMP_0001

# Recomendación re-cotizada con Euríbor al 3 %
curl "localhost:8000/api/pulse/recommendations/COMP_0001?euribor=0.03"

# Puntuar un dataset nuevo
curl -X POST localhost:8000/api/score -H "X-API-Key: $XRAY_API_KEY" -F file=@hidden.zip
```
