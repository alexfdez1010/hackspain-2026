# 🧹 Data cleaning

How the eight raw CSV files become the tables that feed the score and the
forecast: what is dropped or nulled at each step, with which thresholds, and how
much the forecast changes if the data is cleaned differently. Everything
described here lives in `src/ml_service/pulse/load.py` and
`src/ml_service/pulse/clean/`, and every rule leaves its footprint (rows
affected, total and share) in `data/pulse/cleaning_report.{json,md}` when
`uv run pulse` runs. The same two files are copied into
`<output folder>/reports/`.

## Flow

```
raw CSVs ──load_raw──▶ RawData (typed, Parquet cache)
                          │
                          ├─ clean_transactions ─▶ settled transactions in EUR
                          ├─ clean_invoices ─────▶ real invoices in EUR with validated dates
                          └─ clean_cash_balances ▶ credible balance anchors (uses the cleaned transactions)
                                     │
                                CleanData ──build_panel──▶ company × month panel ──▶ PULSE ──▶ forecast
```

Order matters: balances are validated against the already cleaned monthly
flows, so they go last. The `companies`, `products`, `debt_products` tables and
the `balances` snapshot pass through untouched (they are only typed).

## 1. Loading (`load.py`)

- Everything is read as text and converted leniently: a date or an amount that
  does not parse becomes null instead of breaking the load.
- Parsed dates: `date` and `value_date` in transactions; `issuance_date`,
  `due_date` and `payment_date` in invoices; `date` in balances; next and last
  instalments in `debt_schedule_config`.
- Amounts cast to `Float64`: `balance`, `available`, `granted`, `liquidity`,
  `countable`, `outstanding`, `amount`, `pending_amount`, `exchange_rate`.
- Each table is cached as Parquet under `data/pulse/cache/`; deleting that
  folder forces the CSVs to be read again.

## 2. Currency (`clean/currency.py`)

- There are 44 currencies and the `exchange_rate` column is not reliable (it is
  1.0 in 43 % of the USD rows, has zeros and values of 6,500), so it is
  **ignored**.
- Every amount is divided by a **fixed FX table** (`fx.py`, units per euro) and
  stored as `<column>_eur`.
- A transaction's currency is the product's; if missing, the company's; if
  missing, EUR. For invoices: `currency`, then `accounting_currency`, then EUR.
- A currency missing from the table is treated as EUR and logged in the report
  (today: 0 rows).

## 3. Transactions (`clean/transactions.py`)

Order of application and current footprint on 2,556,437 rows:

| Step | Rule | Affected |
|---|---|---|
| Duplicates | Exact duplicate on (company, product, date, amount, description) removed; first occurrence kept. | 112,346 (4.4 %) |
| Status | Transactions with `status = pending` are dropped (not settled). Null status is kept: four companies only have such rows. | 5,551 (0.2 %) |
| Booking date | Null or outside the window [2024-09-01, 2026-09-01] → row dropped. | 0 |
| Amount | Null or zero → dropped. | 349 |
| Value date | If null or more than 30 days from the booking date it is replaced by the booking date. **Note:** downstream only the booking date is used, so this rule changes no result today; it is kept for traceability. | 2,639 (0.1 %) |
| Product | The product type (`checking`, `saving`, `wallet`, lines, loans…) and its currency are joined. A product absent from the product tables takes its company's currency. | 1,305 |
| Currency | Conversion to EUR (section 2). | 234,530 converted (9.6 %) |
| Absurd values | `|amount_eur| > 1e9` → dropped. | 0 |
| Relative outliers | `|amount_eur| > 20 × the company's own p99` **and** `> 1e6 EUR` → dropped. These are sentinels seeded in the data. | 178 rows from 39 companies |
| Counterparty | `counterparty_ref` = `counterparty_id` when filled; otherwise the `COUNTERPARTY_xxxxx` token extracted from the description. | 500,661 resolved from the token (20.5 %); 69.4 % still without a counterparty |

Output: 2,438,013 transactions with `transaction_id`, company, product and
its type, booking date, `amount_eur`, category, description and counterparty.

## 4. Invoices (`clean/invoices.py`)

On 897,894 ERP documents:

| Step | Rule | Affected |
|---|---|---|
| Document type | Only `invoice` and `invoiceGroup`; payments, credit notes, delivery notes… are dropped. | 123,713 (13.8 %) |
| Status | `status = cancel` → dropped. | 12,099 (1.3 %) |
| Amount | Null or zero → dropped. | 968 |
| Issuance | `issuance_date` null or after the extraction date → dropped. | 591 |
| Currency | `currency`, then `accounting_currency`, then EUR; `amount` and `pending_amount` converted to EUR. | 110,347 converted (14.5 %) |
| Due date | `due_date` kept only if 0 ≤ due − issuance ≤ 365 days; otherwise nulled (unknown). | 16,356 (2.2 %) |
| Payment date | Trusted only if `status = paid` and `pending_amount` ≈ 0 (≤ 1 % of the amount) and 0 ≤ payment − issuance ≤ 730 days and not in the future. Unpaid documents carry the due date as payment date, which is why it is ignored. | 198,589 not trusted (26.1 %); 30,552 paid with an impossible date (4.0 %) |
| Outliers | `|amount_eur| > 20 × the company's p99` **and** `> 1e6 EUR` → dropped. | 77 invoices worth 1.2 bn EUR |

Output: 760,459 invoices with `side` (`ar` when the amount is positive, `ap`
when negative), absolute amount in EUR, `pending_eur` (0 when settled;
otherwise the minimum of pending and amount) and the three validated dates.

## 5. Balances (`clean/balances.py`)

On 4,898 cash products (`checking`, `saving`, `wallet`):

| Step | Rule | Affected |
|---|---|---|
| No snapshot | Cash product without a row in `balances` → no anchor. | 209 (4.3 %) |
| Currency | Balance converted to EUR. | 1,001 converted |
| Implausible balance | `|balance_eur| > 20 × the company's gross monthly flow` **and** `> 1e6 EUR` → anchor nulled (there were snapshots of 99,999,990,000 and of −1 bn). | 11 |
| Zero balance | Kept, but a weak anchor. | 961 (19.6 %) |

An account **without an anchor** is rebuilt from its flows and shifted so that
its lowest day equals zero (conservative criterion, in `features/cash.py`).

## 6. Thresholds

All of them live in `CleaningThresholds` (`src/ml_service/pulse/config.py`), in EUR:

| Threshold | Value | Use |
|---|---|---|
| `tx_outlier_mult` / `tx_outlier_min` | 20 / 1e6 | transaction outliers |
| `tx_abs_cap` | 1e9 | absolute cap on transactions |
| `inv_outlier_mult` / `inv_outlier_min` | 20 / 1e6 | invoice outliers |
| `balance_mult` / `balance_min` | 20 / 1e6 | implausible snapshots |
| `max_terms_days` | 365 | maximum issuance → due term |
| `max_pay_days` | 730 | maximum issuance → payment term |
| `max_value_date_gap` | 30 | maximum value ↔ booking date distance |

The cleaning functions accept an alternative `CleaningThresholds` as an
argument, which allows testing variants without touching the configuration.

## 7. Resulting coverage

1,286 companies with transactions (all of them), 784 with invoices (718 with
receivables, 782 with payables). The 541 companies without an ERP receive bank
proxies for the receivables and payables variables (see the README, "Bank
proxies").

## 8. Sensitivity of the forecast to the cleaning (2026-09-19)

The whole pipeline (cleaning → panel → PULSE with the frozen normaliser →
forecast frame) was rebuilt under nine variants (measured when the forecast
still covered twelve horizons; the conclusion carries over to the six-month
model) and the forecast was evaluated
with the same test protocol as the production model: GroupKFold(5) by
`group_id`, out of sample, 169,691 rows (company-month, horizon). Since each
variant also changes the score, and therefore the target, the comparable column
is the **gain over persistence**, not the absolute MAE.

| Variant | Transactions | Invoices | MAE persistence | MAE model | Gain | +1 | +6 | +12 |
|---|---|---|---|---|---|---|---|---|
| **Current** | 2,438,013 | 760,459 | 11.11 | 8.97 | +19.2 % | 5.66 | 9.64 | 11.10 |
| No outlier filter | 2,438,191 | 760,536 | 11.15 | 9.03 | +19.1 % | 5.70 | 9.69 | 11.15 |
| Strict outliers (5 × p99, > 1e5) | 2,437,019 | 759,902 | 11.26 | 9.08 | +19.4 % | 5.61 | 9.77 | 11.46 |
| Keep `pending` transactions | 2,443,560 | 760,459 | 11.11 | 8.96 | +19.3 % | 5.64 | 9.63 | 11.11 |
| No transaction dedup | 2,549,312 | 760,459 | 11.05 | 8.89 | +19.6 % | 5.65 | 9.53 | 10.96 |
| Value date instead of booking date | 2,438,013 | 760,459 | 11.16 | 8.97 | +19.6 % | 5.68 | 9.64 | 11.06 |
| Only `document_type = invoice` | 2,438,013 | 746,696 | 11.09 | 8.97 | +19.2 % | 5.66 | 9.63 | 11.10 |
| Strict invoice dates (180 / 365 d) | 2,438,013 | 760,459 | 11.11 | 8.98 | +19.2 % | 5.66 | 9.63 | 11.13 |
| Lax invoice dates (730 / 1460 d) | 2,438,013 | 760,459 | 11.11 | 8.97 | +19.3 % | 5.66 | 9.63 | 11.08 |

Reading: the gain moves between +19.1 % and +19.6 % under every variant, i.e.
within the noise of the cross-validation. No alternative cleaning improves the
forecast materially, and the ones that seem to lower the absolute MAE (no
dedup) do so because they change the score and its persistence, not because
the model is more accurate. The current rules stay because they remove
demonstrable errors (exact duplicates, sentinels, impossible dates) at no cost
in predictive power. The limit of the forecast is the available signal (at
most 24 months of history per company), not the cleaning.

## 9. Earlier exploration (`analysis/`)

Before the cleaning layer existed, `analysis/analyze_balances.py` and
`analysis/balances_outliers.py` profiled `balances.csv`: missing values per
column, the balance distribution and its box plot, the time series of
snapshots, the top extreme balances and liquidity against granted amounts. The
charts and the two CSV reports are kept under `analysis/output/`. That
exploration is what surfaced the sentinel snapshots (99,999,990,000 EUR and
−1 bn) that section 5 now discards. The scripts need `matplotlib` and `pandas`,
which are not project dependencies:

```bash
uv run --with matplotlib --with pandas python analysis/analyze_balances.py
```
