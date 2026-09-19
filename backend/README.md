# 🐍 backend · Embat PULSE pipeline

The Python side of HackSpain 2026. It reads the raw bank and ERP tables of a
portfolio of SMEs and produces, **for every company**, a transparent 0-100
financial-health score (**PULSE**, *Payment, Underwriting, Liquidity &
Solvency Estimate*), a six-month forecast with bands, early-warning signals and
priced product recommendations, all as JSON files that the web app in
[`../frontend`](../frontend) bundles.

There is **no server**: one terminal command runs the whole thing and writes a
folder.

Stack: Python 3.12, [uv](https://docs.astral.sh/uv/), Polars, LightGBM,
scikit-learn, pytest, Ruff. Guidelines for AI coding assistants:
[`AGENTS.md`](./AGENTS.md).

## ⚡ Quick start

```bash
# Install uv once
curl -LsSf https://astral.sh/uv/install.sh | sh

cd backend
uv sync                              # creates .venv with every dependency

# Put the eight raw CSVs in data/raw/xray/ (a symlink to the dataset folder is fine)
ls data/raw/xray
# balances.csv banking_products.csv companies.csv debt_products.csv
# debt_schedule_config.csv groups.csv invoices.csv transactions.csv

uv run pulse                         # ≈ 2 minutes -> data/pulse/export/
```

That is the whole product. To feed the web app directly:

```bash
uv run pulse --out ../frontend/src/data/pulse     # or: make pulse-web
```

## 🧭 The one command: `uv run pulse`

```
uv run pulse [--raw-dir DIR] [--out DIR] [--work-dir DIR] [--frozen] [--models-dir DIR] [--no-evaluate] [--export-only]
```

| Option | Default | What it does |
| --- | --- | --- |
| `--raw-dir DIR` | `data/raw/xray` | Folder with the eight raw CSVs. Any folder with the same files works. |
| `--out DIR` | `<work dir>/export` | Output folder. Created if missing; its contents are replaced. |
| `--work-dir DIR` | `data/pulse` (train) · `data/pulse/runs/<dataset>` (frozen) | Where intermediate artefacts, models and reports go. |
| `--frozen` | off | Do not fit anything: score the dataset with the models already trained (see below). |
| `--models-dir DIR` | `data/pulse/models` | Where a frozen run takes its models from. |
| `--no-evaluate` | off | Skip the out-of-fold evaluations (the forecast step takes about half the time; the evaluation reports are not refreshed). |
| `--export-only` | off | Rebuild the JSON export from the artefacts of the last run without refitting or predicting (≈ 6 s). |

`PULSE_DATA_DIR=<dir>` (environment or `.env`) moves the whole `data/` root.

### Three ways to run it

| Mode | Command | When |
| --- | --- | --- |
| **Train** | `uv run pulse` | The normal case: fit every model on the dataset given and export every company. Reproducible: two runs on the same data write byte-identical JSON. |
| **Frozen** | `uv run pulse --frozen --raw-dir /path/to/hidden_test` | A new dataset must be scored with the models trained on the reference one (hidden test set). Its artefacts land in `data/pulse/runs/hidden_test/`, the training run is never touched, and the evaluation reports of the frozen models are copied along. |
| **Export only** | `uv run pulse --export-only --out ../frontend/src/data/pulse` | You only want the JSON again, for another folder. |

`make` shortcuts (`make help` lists them): `make pulse`, `make pulse-web`,
`make pulse-frozen RAW=/path`, `make pulse-export OUT=/path`; every target
accepts `RAW=`, `OUT=`, `WORK=` and `NO_EVAL=1`.

### What it prints

```
PULSE pipeline · mode=train
  raw:  /…/backend/data/raw/xray
  work: /…/backend/data/pulse
  out:  /…/backend/data/pulse/export
▶ clean + panel          done in 1.9 s      # 2.4 M transactions, 760 k invoices -> 14,514 company-months
▶ PULSE score            done in 0.1 s
▶ forecast +1..+6        done in 79 s       # one LightGBM + out-of-fold band + evaluation
▶ signals                done in 1.9 s
▶ advisor                done in 0.6 s
▶ web JSON               done in 3.2 s
▶ assemble               done in 0.5 s
✔ /…/backend/data/pulse/export
```

## 📂 Where everything lands

```
backend/data/                        (nothing under data/ is versioned)
├── raw/xray/*.csv                   the input dataset
└── pulse/                           work dir of the training run
    ├── cache/*.parquet              typed copy of each raw table (delete to re-read the CSVs)
    ├── panel.parquet                company × month raw variables
    ├── clean_transactions.parquet   cleaned bank movements (used by the evaluations)
    ├── scored_panel.parquet         PULSE, pillars, variables, contributions, confidence per month
    ├── forecast_frame.parquet       features of the forecast model
    ├── forecast.{parquet,csv}       +1..+6 forecast from the last month of every company
    ├── signals.parquet              every episode where the score really moved
    ├── recommendations/             Advisor: summary.json, catalogue.json, snapshots.json, companies/
    ├── web/                         summary.json, companies/, details/ (the web export before assembly)
    ├── models/                      normalizer.json, forecast/{model.txt,model.json}, signals.json, risk_model.json
    ├── cleaning_report.{json,md}    what every cleaning rule dropped or nulled
    ├── evaluation.json              does PULSE anticipate stress? (AUROC by variable, by segment)
    ├── forecast_evaluation.json     OOF MAE per horizon vs persistence and mean reversion
    ├── signals_evaluation.json      persistence models + anticipation curve
    ├── risk_evaluation.json         Advisor stress scorecard
    ├── runs/<dataset>/              work dirs of frozen runs on other datasets
    └── export/                      ⬇ the output folder
```

The output folder is what the web app reads. Every field is documented in
[`docs/json-contract.md`](docs/json-contract.md):

```
<out>/
├── summary.json                       score definition, evaluation figures, latest PULSE of every company
├── companies/<company_id>.json        monthly history, 6-month forecast with bands, signals
├── details/<company_id>.json          the customers, suppliers, accounts, lines and debt behind each variable
├── recommendations/catalogue.json     products, pricing parameters, risk-model figures
├── recommendations/companies/<id>.json  the explainable recommendation
├── reports/                           the cleaning and evaluation reports listed above
└── manifest.json                      when it was generated, from which folder, how many files
```

On the hackathon dataset: 1,285 companies, 3 × 1,285 JSON files, about 90 MB,
last observed month 2026-08.

## 🧱 What the pipeline does, step by step

| Step | Module | Reads | Writes |
| --- | --- | --- | --- |
| 1. Clean + panel | `pulse/load.py`, `pulse/clean/`, `pulse/features/`, `pulse/panel.py` | the 8 CSVs | `panel.parquet`, `clean_transactions.parquet`, `cleaning_report.*` |
| 2. PULSE score | `pulse/normalize.py`, `pulse/score.py`, `pulse/engine.py`, `pulse/evaluate.py` | panel | `models/normalizer.json`, `scored_panel.parquet`, `evaluation.json` |
| 3. Forecast | `pulse/forecast/` | scored panel + cleaned tables | `models/forecast/`, `forecast_frame.parquet`, `forecast.*`, `forecast_evaluation.json` |
| 4. Signals | `pulse/signals/` | scored panel | `models/signals.json`, `signals.parquet`, `signals_evaluation.json` |
| 5. Advisor | `pulse/recommend/` | scored panel, forecast, raw products, cleaned invoices | `models/risk_model.json`, `risk_evaluation.json`, `recommendations/` |
| 6. Web JSON | `pulse/export_web.py`, `pulse/details/`, `pulse/export_details.py` | everything above | `web/` |
| 7. Assemble | `pulse/run/assemble.py` | `web/`, `recommendations/`, reports | the output folder |

The orchestration lives in `pulse/run/` (`options.py` resolves the paths,
`steps.py` runs each step, `cli.py` is the command). Every step is also a
standalone command for debugging one piece (`make pulse-build`, `pulse-fit`,
`pulse-evaluate`, `pulse-forecast-fit`, `pulse-forecast-evaluate`,
`pulse-forecast`, `pulse-signals-fit`, `pulse-signals-build`,
`pulse-signals-show COMPANY=COMP_0001`, `pulse-reco-fit`, `pulse-reco-build`,
`pulse-reco-show COMPANY=COMP_0001`, `pulse-export-web`,
`pulse-export-details`, and `pulse-score RAW=/path` for a flat CSV of scores).

## 📊 PULSE: the score

A fully transparent 0-100 score built in `src/ml_service/pulse/` from 11
variables with fixed percentage weights. It has its own loader, cleaning layer
and feature code because the raw dataset is deliberately corrupted
(currencies, sentinel amounts, impossible dates, duplicates).

### The 11 variables and their weights

| # | Variable (as shown in the product) | Pillar | Weight | Components (direction) | Source |
| --- | --- | --- | --- | --- | --- |
| 2 | Mínimo intramensual de caja | liquidez | 14 | lowest daily consolidated cash / avg monthly outflow (+), clipped ±12 | transactions + balances |
| 1 | Días de caja | liquidez | 12 | month-end cash / (90-day operating outflow / 90) (+), capped 365 | transactions + balances |
| 3 | Utilización de líneas | deuda | 12 | drawn / limit (−), and its Δ3m (−) | debt_products + line transactions |
| 8 | Tramo +90 días | cobro | 12 | open receivables > 90 d past due / open receivables (−), Δ3m (−) | invoices (AR); bank proxy: returned collections |
| 12 | Exposición a contrapartes | cobro | 10 | Σ billing share × Δ3m of that customer's on-time share (+) | invoices (AR); bank proxy: what the company's payers pay others |
| 9 | Caída del cliente top | cobro | 8 | billing growth to the top-12m customer, 3m vs previous 3m (+), clipped ±1 | invoices (AR); bank proxy: attributed bank collections |
| 10 | Vencimientos 6 m ÷ caja | deuda | 8 | 2 × trailing-3m debt service / month-end cash (−), 0 = best, capped 12 | transactions (debt_repayment, interest_charge) |
| 4 | Aceleración de utilización | deuda | 6 | Δ3m of the utilisation Δ3m (−) | as #3 |
| 5 | DPO real y su Δ | pago | 6 | payment − issuance on settled supplier invoices, value-weighted 3m (−), Δ3m (−) | invoices (AP) |
| 6 | Plazo concedido por proveedores | pago | 6 | due − issuance on supplier invoices, value-weighted 6m (+), Δ6m (+) | invoices (AP) |
| 7 | DSO real | cobro | 6 | payment − issuance on settled customer invoices, value-weighted 3m (−) | invoices (AR) |

Pillars: liquidez 26, deuda 26, cobro 36, pago 12. `variables.py` is the
single source of truth; the weights must sum to 100 (asserted at import).

### Scoring

Every component is mapped to its empirical percentile on the training panel
(1,001-point grid, mid-rank ties, sign-aligned so higher is healthier; an exact
0 on #10 is the optimum). A variable is the mean of its known components;
`pulse` is the weighted mean of the known variables with the weights
renormalised, so an unknown variable neither helps nor hurts. `confidence` is
the share of the 100 points backed by data (a proxy-backed variable counts only
part of its weight; `confidence_from_proxies` is the share that comes from
proxies and `var_<key>__source` says `primary`, `proxy` or null). No further
calibration is applied: 80 means the known variables average a score of 80
(half the companies sit between 41 and 64). `contrib_<key>` splits `pulse`
into the points each variable is responsible for. Everything after the panel is
per company, so a hidden folder is scored exactly as the training one.

### Cleaning

Every rule and its footprint, the thresholds and a sensitivity study of the
forecast to alternative cleanings: [`docs/data-cleaning.md`](docs/data-cleaning.md).
In short: a fixed FX table instead of the corrupt `exchange_rate`; exact
duplicates dropped (4.4 % of transactions); sentinel amounts dropped when
> 20 × the company's own p99 and > 1 M EUR; balance snapshots of
99,999,990,000 EUR treated as no anchor; only the booking date is used; invoice
due and payment dates trusted only inside plausible windows; only real
invoices (`invoice`, `invoiceGroup`). Coverage after cleaning: 1,286 companies
with transactions, 784 with invoices (718 with receivables).

### Bank proxies for companies without ERP (`features/bank_proxies.py`)

541 of the 1,286 companies have no ERP, so #5-#9 and #12 are unknown for them.
Bank statements still say who pays the company: the `counterparty_id` column is
filled in 1 % of their transactions, but the narrative carries the
`COUNTERPARTY_xxxxx` token in 28 % of collections and payments, so the cleaning
layer adds `counterparty_ref` = column, else token. Three variables get a
bank-side substitute, computed for **every** company and used only when the
invoice components are all missing:

| # | Proxy component(s) | Definition | Coverage column |
| --- | --- | --- | --- |
| 8 | `returned_share` (−, 0 = best), `returned_d3` (−) | returned collections (`collection_refund`) / collections on cash accounts, trailing 3m | none (1.0) |
| 9 | `top_client_growth_bank` (+) | same formula as #9 on collections attributed to a payer | `top_client__proxy_coverage`: attributed share of 12m collections |
| 12 | `network_exposure_bank` (+) | Σ (payer's share of the company's 6m collections) × Δ3m of what that payer pays **other** companies of the portfolio, clipped ±1; payers seen in one company only are skipped | `network__proxy_coverage`: share of 6m collections from payers seen elsewhere |

A proxy-backed variable carries `proxy_confidence` (0.5) × coverage of its
weight in both the numerator and the denominator of the score, so it moves
PULSE less than an ERP-backed one and `confidence` drops with it. A coverage
below `MIN_PROXY_COVERAGE` (5 %) leaves the variable unknown. On the hackathon
data the proxies add a median of 6 confidence points (placeholders hide most
payer names in this synthetic dataset). In this dataset a customer ID never
appears under two companies (1 shared ID out of 55,052), so #12 collapses to
the company's own customer-level deterioration; set `MIN_COMPANIES = 2` in
`features/network.py` on real data to make it a true network signal.

### Does it anticipate stress? (`evaluation.json`)

Stress month = lowest daily cash below zero or a returned direct debit
narrative; label = ≥ 2 stress months in the next 6 (rate 22.4 % over 14,521
company-months with an observable future). AUROC of PULSE for "no stress
ahead": **0.821** (0.809 on months ≥ 2025-09). Restricted to companies **not**
stressed today: 0.639, the honest anticipation number. By variable: #2 0.870,
#1 0.859, #10 0.633; every ERP-side variable, the bank proxies and the
credit-line pair sit at 0.46-0.53, i.e. on this synthetic dataset they carry
no signal about future bank stress. The 36 points on *cobro* and 12 on *pago*
are therefore a product decision, not something these data support. Why the
score is not a supervised model: [`docs/model-selection.md`](docs/model-selection.md).

## 🔮 Forecast: +1..+6 months (`pulse/forecast/`)

A **single LightGBM** (`objective=huber`, `alpha=6`, fixed seed, deterministic)
predicts the *change* of PULSE between month *t* and *t+h*; the horizon `h` is
an ordinary input column, so every (company-month, horizon) pair is one training
row and extending the range is a change in `config.HORIZONS` (`MAX_HORIZON = 6`).
Persistence is the starting point and the model only learns deviations. The
p10-p90 band is **conformal** (the 10th/90th percentile of the out-of-fold
residual at each horizon, GroupKFold(5) on `group_id`), stored in `model.json`.
LightGBM's per-feature contributions are folded into the 11 variables plus
`contexto` and `base`, and they sum to the predicted change exactly.

Inputs: the 11 variables and their percentiles, Δ1/Δ3/Δ6 and 6-month
volatility, the four pillars and PULSE itself, cash-account flows, the invoice
calendar (AR/AP due within 1/3/6 months, open overdue amounts), stress
narratives, intragroup inflow share, group mean PULSE, observation length and
the horizon (190 features).

**Evaluation** (`forecast_evaluation.json`; GroupKFold(5) on `group_id`, MAE
in points of PULSE; "reversion" is a one-parameter mean-reversion baseline
fitted out of fold). Over 106,327 stacked rows the model's MAE is **7.91**
against 9.75 for persistence (+18.9 %) and 9.50 for reversion (+16.8 %), with
80 % of the outcomes inside the band.

| horizon | rows | persist | reversion | ML | vs persist | vs reversion | direction on moves > 15 | recall declines | recall improvements | p10-p90 coverage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| +1 | 20,932 | 5.72 | 5.89 | **5.53** | +3.3 % | +6.1 % | 0.87 | 0.51 | 0.45 | 0.80 |
| +2 | 19,647 | 8.47 | 8.34 | **7.18** | +15.2 % | +13.9 % | 0.89 | 0.66 | 0.57 | 0.80 |
| +3 | 18,362 | 10.52 | 9.97 | **8.27** | +21.4 % | +17.0 % | 0.90 | 0.73 | 0.62 | 0.80 |
| +4 | 17,077 | 11.20 | 10.51 | **8.72** | +22.2 % | +17.1 % | 0.89 | 0.75 | 0.61 | 0.80 |
| +5 | 15,795 | 11.83 | 10.99 | **9.16** | +22.6 % | +16.7 % | 0.90 | 0.77 | 0.59 | 0.80 |
| +6 | 14,514 | 12.35 | 11.39 | **9.55** | +22.6 % | +16.1 % | 0.90 | 0.78 | 0.54 | 0.80 |

Temporal backtest (fit ≤ 2025-08, test ≥ 2025-09): 5.65 vs 5.69 persistence at
+1, 8.55 vs 10.28 at +3, 9.96 vs 12.14 at +6. The band offsets grow with the
horizon (≈ ±8.5 points at +1, ≈ ±15 at +6). Read the forecast as an early
warning with a band, not as a promise. The web app shows the six horizons and
the Advisor uses the +6 outlook. Why this model and not the dozen alternatives
that were benchmarked: [`docs/model-selection.md`](docs/model-selection.md).

## 🚨 Signals: when the score really moved (`pulse/signals/`)

A signal opens the first month PULSE sits **6 points or more** away from its
own three-month baseline **and at least two pillars** moved 3 points the same
way; a steady slide is one episode. Three months later it is labelled
**persistent** (never back within 3 points of the baseline) or **transitory**;
until then it is *open*. One standardised logistic regression per direction
(GroupKFold(5) by company) estimates `p_persistent` the month the signal opens,
which names it: fall with p ≥ 0.5 → **caída**, else **bache**; rise → **mejora**
or **repunte**. On the hackathon panel: 1,858 falls (65 % persistent, OOF AUROC
0.747) and 1,046 rises (55 %, 0.672).

Anticipation curve (`signals/anticipation.py`): for every company-month with no
stress in the last three months, flagging the lowest 20 % of scores:

| horizon | rows | base rate | AUROC | recall of coming stress | lift |
| --- | --- | --- | --- | --- | --- |
| +1 m | 16,026 | 2.3 % | 0.668 | 43 % | 2.1x |
| +3 m | 13,994 | 6.1 % | 0.645 | 37 % | 1.9x |
| +6 m | 10,981 | 10.6 % | 0.619 | 34 % | 1.7x |

`companies/<id>.json` carries `signals[]` and `summary.json` →
`evaluation.signals` the figures above.

## 💼 Advisor: products priced from PULSE (`pulse/recommend/`)

Given a company's latest snapshot, the Advisor decides **which financial
products fit, how much to offer and at what rate**, and explains every step in
Spanish. It is rule-based where the decision must be auditable (eligibility,
sizing; thresholds in `recommend/config.py`) and uses a small model where a
probability is needed (the risk premium).

| key | product | when it fits (rule file) | sizing |
| --- | --- | --- | --- |
| `credit_line` | Línea de crédito | cash days < 30 or intramonth minimum < 0.25 months, no idle line, PULSE ≥ 30 (`rules_liquidity.py`) | 0.35-1.5 months of outflow by PULSE band, net of available line |
| `credit_line_increase` | Ampliación de línea | existing line drawn ≥ 80 %, PULSE ≥ 30 | +15/30/50 % of the limit by PULSE band |
| `factoring` | Anticipo de facturas | ERP receivables ≥ 20 k€ not > 90 d overdue, +90 d bucket ≤ 40 %, DSO > 45 favours it, PULSE ≥ 20 (`rules_receivables.py`) | 75-85 % of current receivables, cap 3 months of billing |
| `confirming` | Confirming de proveedores | ERP purchases ≥ 15 k€/month, short supplier terms (< 20 d) or paying late, PULSE ≥ 30 (`rules_payables.py`) | 1.5 months of purchases |
| `term_loan` | Préstamo a plazo | PULSE ≥ 60, maturities/cash < 1, balanced cash (`rules_debt.py`) | 3 months of collections × 70-100 %, 48 months |
| `refinancing` | Reestructuración de vencimientos | debt outstanding and 6-month service ≥ 1× cash (≥ 3× severe), PULSE ≥ 15 (`rules_refinancing.py`) | loans outstanding (or 12 months of service), 60 months |
| `treasury_deposit` | Depósito de excedentes | cash days ≥ 180, intramonth minimum ≥ 1 month, no maturity pressure, excess ≥ 50 k€ after a 90-day buffer (`rules_treasury.py`) | cash − 90 days of outflow; 3/6/12 months by cash days |

Every rule returns reasons (`pro`, `contra`, `bloqueo`) tied to a PULSE
variable, its raw value and the threshold, and a fit = 30 + Σ points. A
blocked product is never offered; eligible products with fit ≥ 40 are ranked
and the top three priced; the rest are reported under `declined` with the why.

**Price** (`recommend/pricing.py`):

```
spread = product margin (90-200 bp)
       + risk premium          = PD12m × 25 % (stress -> default) × LGD, cap 900 bp
       + data-uncertainty premium = 75 bp × (1 − confidence)
       + trend adjustment      (+25 bp if the +6 m forecast drops ≥ 5 points, −15 bp if it rises ≥ 5)
       [+ 25 bp when the current line is ≥ 90 % drawn]
rate   = reference rate (Euríbor 12 m, 2.10 %) + spread, clamped to the product's band
```

The deposit reads the same table as a yield (Euríbor − 60 bp, +15 bp when cash
covers a year of outflows). PD12m comes from `recommend/risk.py`: a
standardised logistic regression on the four pillars, `confidence` and
log(months observed), trained on the same stress label as the score evaluation,
with a monotone guard (no coefficient may say "healthier is riskier").
Out-of-fold AUROC **0.871**, mean predicted 0.223 vs 0.224 observed. Levers
(`recommend/levers.py`) move each weak pillar to 60 through the risk model and
report the premium saved; with the products blocked only by the PULSE minimum
they form the `improvement_plan` of companies that get no product today.

**Results on the hackathon data** (top product of each company):

| top product | companies |
| --- | --- |
| credit_line | 541 |
| none | 214 |
| refinancing | 173 |
| treasury_deposit | 151 |
| confirming | 125 |
| factoring | 42 |
| term_loan | 34 |
| credit_line_increase | 5 |

Most companies without an offer have PULSE < 30 or no activity in the window,
by design (no new credit for a company already in stress); the improvement plan
is their answer.

## 🧪 Tests and quality

```bash
make test              # unit + integration
make test-unit         # tests/unit: fast, synthetic frames (≈ 2 s)
make test-integration  # tests/integration: rebuilds the export of the real run into a temp folder
                       # (skipped automatically when data/raw/xray or a finished run is missing)
make format && make lint
make pre-commit        # unit tests + format + lint, required before committing
```

Unit tests cover the cleaning rules, the score, the bank proxies, the forecast
(including the regression test that keeps the far horizons moving), the
signals, the Advisor rules and pricing, the detail export and the `pulse`
command itself (option defaults, frozen-model copy, output-folder assembly).

## 📚 Documentation

| Document | What it covers |
| --- | --- |
| [`docs/data-cleaning.md`](docs/data-cleaning.md) | Every cleaning rule with its footprint, thresholds, coverage, the sensitivity study and the earlier `analysis/` exploration |
| [`docs/model-selection.md`](docs/model-selection.md) | Why each model was chosen and what was benchmarked and rejected, with out-of-fold numbers |
| [`docs/json-contract.md`](docs/json-contract.md) | Every file and field of the output folder |
| `analysis/` | Exploratory profiling of `balances.csv` (scripts, charts and CSV reports) that surfaced the sentinel snapshots |
| [`AGENTS.md`](./AGENTS.md) | Conventions for AI coding assistants (uv, tests, Ruff, 150-line files, SOLID) |

## 🗃️ Project structure

```
backend/
├── src/ml_service/pulse/
│   ├── run/            the `pulse` command: options, steps, assembly
│   ├── load.py         raw CSV loader with Parquet cache
│   ├── clean/          cleaning rules and the cleaning report
│   ├── features/       cash, credit, payables, receivables, network, bank proxies
│   ├── panel.py        company × month panel
│   ├── variables.py    the 11 variables, pillars and weights (single source of truth)
│   ├── normalize.py · score.py · engine.py · evaluate.py
│   ├── forecast/       LightGBM model, features, conformal band, attribution, evaluation
│   ├── signals/        detection, persistence model, anticipation curve
│   ├── recommend/      catalogue, rules, sizing, pricing, risk model, levers, explanations
│   ├── details/        the tables behind each variable
│   ├── export_web.py · export_details.py
│   └── cli.py          standalone build / fit / evaluate / score commands
├── tests/unit · tests/integration
├── docs/               data-cleaning.md · model-selection.md · json-contract.md
├── analysis/           early exploration of balances.csv
├── data/               raw CSVs, artefacts, models, export (not versioned)
├── Makefile · pyproject.toml · uv.lock · .env.example
└── AGENTS.md
```
