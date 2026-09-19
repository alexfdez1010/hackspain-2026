# Limpieza de datos de PULSE

Cómo pasan los ocho CSV crudos a las tablas que alimentan el score y la previsión,
qué se descarta o se anula en cada paso, con qué umbrales, y cuánto cambia la
previsión si se limpia de otra manera. Todo lo que aquí se describe vive en
`src/ml_service/pulse/load.py` y `src/ml_service/pulse/clean/`, y cada regla deja
su huella en `data/pulse/cleaning_report.{json,md}` (filas afectadas, total y
porcentaje) al ejecutar `make pulse-build`.

## Flujo

```
CSV crudos ──load_raw──▶ RawData (tipado, caché Parquet)
                             │
                             ├─ clean_transactions ─▶ transacciones liquidadas en EUR
                             ├─ clean_invoices ─────▶ facturas reales en EUR con fechas validadas
                             └─ clean_cash_balances ▶ anclas de saldo creíbles (usa las transacciones limpias)
                                        │
                                   CleanData ──build_panel──▶ panel empresa × mes ──▶ PULSE ──▶ previsión
```

El orden importa: los saldos se validan contra el flujo mensual ya limpio, por eso
van los últimos. Las tablas `companies`, `products`, `debt_products` y el snapshot de
`balances` se pasan tal cual (solo se tipan).

## 1. Carga (`load.py`)

- Todo se lee como texto y se convierte de forma laxa: una fecha o un importe que
  no parsea queda a nulo en vez de romper la carga.
- Fechas parseadas: `date` y `value_date` en transacciones; `issuance_date`,
  `due_date` y `payment_date` en facturas; `date` en balances; próximas/últimas
  cuotas en `debt_schedule_config`.
- Importes a `Float64`: `balance`, `available`, `granted`, `liquidity`,
  `countable`, `outstanding`, `amount`, `pending_amount`, `exchange_rate`.
- Cada tabla se cachea en Parquet bajo `data/pulse/cache/`; borrar esa carpeta
  fuerza una relectura de los CSV.

## 2. Moneda (`clean/currency.py`)

- Hay 44 monedas y la columna `exchange_rate` no es fiable (vale 1,0 en el 43 %
  de las filas en USD, tiene ceros y valores de 6.500), así que **se ignora**.
- Cada importe se divide por una **tabla fija de tipos de cambio** (`fx.py`,
  unidades por euro) y se guarda como `<columna>_eur`.
- La moneda de una transacción es la del producto; si falta, la de la empresa; si
  falta, EUR. En facturas: `currency`, luego `accounting_currency`, luego EUR.
- Una moneda ausente en la tabla se trata como EUR y se registra en el informe
  (hoy: 0 filas).

## 3. Transacciones (`clean/transactions.py`)

Orden de aplicación y huella actual sobre 2.556.437 filas:

| Paso | Regla | Afectadas |
|---|---|---|
| Duplicados | Se elimina el duplicado exacto en (empresa, producto, fecha, importe, descripción); se conserva la primera aparición. | 112.346 (4,4 %) |
| Estado | Las transacciones con `status = pending` se descartan (no están liquidadas). Las de estado nulo se conservan: cuatro empresas solo tienen filas así. | 5.551 (0,2 %) |
| Fecha contable | Nula o fuera de la ventana [2024-09-01, 2026-09-01] → fila descartada. | 0 |
| Importe | Nulo o cero → descartada. | 349 |
| Fecha valor | Si es nula o dista más de 30 días de la fecha contable se sustituye por la contable. **Nota:** aguas abajo solo se usa la fecha contable, así que esta regla hoy no cambia ningún resultado; se mantiene por trazabilidad. | 2.639 (0,1 %) |
| Producto | Se une el tipo de producto (`checking`, `saving`, `wallet`, líneas, préstamos…) y su moneda. Un producto ausente de las tablas toma la moneda de su empresa. | 1.305 |
| Moneda | Conversión a EUR (sección 2). | 234.530 convertidas (9,6 %) |
| Valores absurdos | `|amount_eur| > 1e9` → descartada. | 0 |
| Outliers relativos | `|amount_eur| > 20 × p99 de la propia empresa` **y** `> 1e6 EUR` → descartada. Son centinelas sembrados en los datos. | 178 filas de 39 empresas |
| Contraparte | `counterparty_ref` = `counterparty_id` si viene relleno; si no, el token `COUNTERPARTY_xxxxx` extraído de la descripción. | 500.661 resueltas por token (20,5 %); 69,4 % siguen sin contraparte |

Salida: 2.438.013 transacciones con `transaction_id`, empresa, producto y su tipo,
fecha contable, `amount_eur`, categoría, descripción y contraparte.

## 4. Facturas (`clean/invoices.py`)

Sobre 897.894 documentos del ERP:

| Paso | Regla | Afectadas |
|---|---|---|
| Tipo de documento | Solo `invoice` e `invoiceGroup`; se descartan pagos, abonos, albaranes… | 123.713 (13,8 %) |
| Estado | `status = cancel` → descartada. | 12.099 (1,3 %) |
| Importe | Nulo o cero → descartada. | 968 |
| Emisión | `issuance_date` nula o posterior a la extracción → descartada. | 591 |
| Moneda | `currency`, luego `accounting_currency`, luego EUR; conversión a EUR de `amount` y `pending_amount`. | 110.347 convertidas (14,5 %) |
| Vencimiento | `due_date` se conserva solo si 0 ≤ vencimiento − emisión ≤ 365 días; si no, queda a nulo (desconocido). | 16.356 (2,2 %) |
| Fecha de pago | Solo se confía en ella si `status = paid` y `pending_amount` ≈ 0 (≤ 1 % del importe) y 0 ≤ pago − emisión ≤ 730 días y no es futura. Los documentos no pagados llevan la fecha de vencimiento como fecha de pago, por eso se ignora. | 198.589 no fiables (26,1 %); 30.552 pagadas con fecha imposible (4,0 %) |
| Outliers | `|amount_eur| > 20 × p99 de la empresa` **y** `> 1e6 EUR` → descartada. | 77 facturas por 1,2 bn EUR |

Salida: 760.459 facturas con `side` (`ar` si el importe es positivo, `ap` si es
negativo), importe absoluto en EUR, `pending_eur` (0 si está liquidada; si no, el
mínimo entre pendiente e importe) y las tres fechas validadas.

## 5. Saldos (`clean/balances.py`)

Sobre 4.898 productos de tesorería (`checking`, `saving`, `wallet`):

| Paso | Regla | Afectadas |
|---|---|---|
| Sin snapshot | Producto de caja sin fila en `balances` → sin ancla. | 209 (4,3 %) |
| Moneda | Conversión a EUR del saldo. | 1.001 convertidas |
| Saldo implausible | `|balance_eur| > 20 × flujo bruto mensual de la empresa` **y** `> 1e6 EUR` → ancla anulada (había snapshots de 99.999.990.000 y de −1 bn). | 11 |
| Saldo cero | Se conserva, pero es un ancla débil. | 961 (19,6 %) |

Una cuenta **sin ancla** se reconstruye a partir de sus flujos y se desplaza para
que su día más bajo valga cero (criterio conservador, en `features/cash.py`).

## 6. Umbrales

Todos viven en `CleaningThresholds` (`src/ml_service/pulse/config.py`), en EUR:

| Umbral | Valor | Uso |
|---|---|---|
| `tx_outlier_mult` / `tx_outlier_min` | 20 / 1e6 | outliers de transacciones |
| `tx_abs_cap` | 1e9 | tope absoluto de transacciones |
| `inv_outlier_mult` / `inv_outlier_min` | 20 / 1e6 | outliers de facturas |
| `balance_mult` / `balance_min` | 20 / 1e6 | snapshots implausibles |
| `max_terms_days` | 365 | plazo máximo emisión → vencimiento |
| `max_pay_days` | 730 | plazo máximo emisión → pago |
| `max_value_date_gap` | 30 | distancia máxima fecha valor ↔ contable |

Las funciones de limpieza aceptan un `CleaningThresholds` alternativo como
argumento, lo que permite probar variantes sin tocar la configuración.

## 7. Cobertura resultante

1.286 empresas con transacciones (todas), 784 con facturas (718 con cobros,
782 con pagos). Las 541 empresas sin ERP reciben proxies bancarios para las
variables de cobro y pago (ver README, "Bank proxies").

## 8. Sensibilidad de la previsión a la limpieza (2026-09-19)

Se reconstruyó todo el pipeline (limpieza → panel → PULSE con el normalizador
congelado → frame de previsión) con nueve variantes y se evaluó la previsión con
el mismo protocolo de test que el modelo de producción: GroupKFold(5) por
`group_id`, fuera de muestra, 169.691 filas (empresa-mes, horizonte). Como cada
variante cambia también el score, y por tanto el target, la columna comparable es
la **ganancia frente a persistencia**, no el MAE absoluto.

| Variante | Transacciones | Facturas | MAE persistencia | MAE modelo | Ganancia | +1 | +6 | +12 |
|---|---|---|---|---|---|---|---|---|
| **Actual** | 2.438.013 | 760.459 | 11,11 | 8,97 | +19,2 % | 5,66 | 9,64 | 11,10 |
| Sin filtro de outliers | 2.438.191 | 760.536 | 11,15 | 9,03 | +19,1 % | 5,70 | 9,69 | 11,15 |
| Outliers estrictos (5 × p99, > 1e5) | 2.437.019 | 759.902 | 11,26 | 9,08 | +19,4 % | 5,61 | 9,77 | 11,46 |
| Mantener transacciones `pending` | 2.443.560 | 760.459 | 11,11 | 8,96 | +19,3 % | 5,64 | 9,63 | 11,11 |
| Sin deduplicar transacciones | 2.549.312 | 760.459 | 11,05 | 8,89 | +19,6 % | 5,65 | 9,53 | 10,96 |
| Fecha valor en vez de contable | 2.438.013 | 760.459 | 11,16 | 8,97 | +19,6 % | 5,68 | 9,64 | 11,06 |
| Solo `document_type = invoice` | 2.438.013 | 746.696 | 11,09 | 8,97 | +19,2 % | 5,66 | 9,63 | 11,10 |
| Fechas de factura estrictas (180 / 365 d) | 2.438.013 | 760.459 | 11,11 | 8,98 | +19,2 % | 5,66 | 9,63 | 11,13 |
| Fechas de factura laxas (730 / 1460 d) | 2.438.013 | 760.459 | 11,11 | 8,97 | +19,3 % | 5,66 | 9,63 | 11,08 |

Lectura: la ganancia se mueve entre +19,1 % y +19,6 % en todas las variantes,
es decir, dentro del ruido de la validación cruzada. Ninguna limpieza alternativa
mejora la previsión de forma material, y las que parecen bajar el MAE absoluto
(sin deduplicar) lo hacen porque cambian el score y su persistencia, no porque el
modelo acierte más. Las reglas actuales se mantienen porque eliminan errores
demostrables (duplicados exactos, centinelas, fechas imposibles) sin coste en
capacidad predictiva. El límite de la previsión está en la señal disponible
(máximo 24 meses de historia por empresa), no en la limpieza.
