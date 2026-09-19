# backend (ml-service)

Python service of HackSpain 2026. It implements PULSE, the transparent
0-100 financial-health score for SMEs, its one-year forecast and the PULSE
Advisor (priced product recommendations), and serves them over HTTP to the web
app in [`../frontend`](../frontend).

Stack: Python 3.12, [uv](https://docs.astral.sh/uv/), pytest, Ruff, FastAPI.
Guidelines for AI coding assistants live in [`AGENTS.md`](./AGENTS.md).

## Setup

```bash
# Install uv (once)
curl -LsSf https://astral.sh/uv/install.sh | sh

cd backend
uv sync          # creates .venv and installs runtime + dev dependencies
cp .env.example .env
```

The raw hackathon CSVs are expected under `data/raw/xray/` (override with
`PULSE_DATA_DIR=<dir>`, which moves the whole `data/` root). Every derived
artefact is written under `data/pulse/`; nothing in `data/` is versioned.

## Commands

```bash
make test              # Unit + integration tests
make test-unit         # Unit tests only (tests/unit)
make format            # Ruff format
make lint              # Ruff check
make pre-commit        # Unit tests + format + lint

make pulse-all         # build (clean + panel) -> fit -> evaluate
make pulse-score RAW=/path/to/hidden_test   # Score an unseen dataset folder
make pulse-forecast-fit && make pulse-forecast   # +1..+12 month forecasts
make pulse-reco-all    # fit the risk model + build the Advisor export
make api-dev           # uvicorn --reload on :8000
```

## API (FastAPI)

The HTTP layer lives in `src/ml_service/api/` and is the **cross-app contract**
with [`../frontend`](../frontend): every payload the Next.js app renders is
served here. It only reads the static exports written by the PULSE CLIs
(`data/pulse/web` and `data/pulse/recommendations`); there is no scoring over
HTTP. Full endpoint reference (params, payloads, errors): [`API.md`](./API.md).

```bash
make api-dev                       # uvicorn --reload on :8000
uv run uvicorn ml_service.api.app:app --port 8011     # explicit port
make api-docker                    # docker build + run (port 8000)
docker compose -f compose.api.yml up --build
```

| Variable | Default | Use |
|---|---|---|
| `PULSE_DATA_DIR` | `backend/data` | Root of the data folder (`pulse/web`, `pulse/recommendations`) |
| `PULSE_CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Allowed browser origins |
| `PORT` | `8000` | Port for the container / `python -m ml_service.api` |

`Dockerfile` is a two-stage build on `python:3.12-slim` (`uv sync --frozen
--no-dev`, `libgomp1` for LightGBM) that bakes `data/pulse/{web,recommendations,models}`
into the image, so the container serves the demo with no volumes.
`.dockerignore` keeps `data/raw` and the parquet caches out. `fly.toml` is a
ready Fly.io config (health check on `/health`, `PORT=8080`);
`compose.api.yml` runs the same image locally.

---

# PULSE: Payment, Underwriting, Liquidity & Solvency Estimate

A fully transparent 0-100 company health score built in `src/ml_service/pulse/`
with 11 variables and fixed percentage weights. It has its own loader, cleaning
layer and feature code, because the raw dataset is deliberately corrupted
(currencies, sentinel amounts, impossible dates, duplicates).

```bash
uv run python -m ml_service.pulse.cli build     # clean + panel -> data/pulse/{panel.parquet,cleaning_report.md}
uv run python -m ml_service.pulse.cli fit       # freeze normaliser -> data/pulse/models/
uv run python -m ml_service.pulse.cli evaluate  # self-supervised anticipation check -> data/pulse/evaluation.json
uv run python -m ml_service.pulse.cli score --raw-dir /path/to/hidden [--out FILE]   # hidden test
```

## The 11 variables and their weights

| # | Variable | Pillar | Weight | Components (direction) | Source |
|---|---|---|---|---|---|
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

Pillars: liquidez 26, deuda 26, cobro 36, pago 12. `variables.py` is the single
source of truth; the weights must sum to 100 (asserted at import).

**Scoring.** Every component is mapped to its empirical percentile on the
training panel (1,001-point grid, mid-rank ties, sign-aligned so higher is
healthier; an exact 0 on #10 is the optimum). A variable is the mean of its known
components; `pulse` is the weighted mean of the known variables with the
weights renormalised, so an unknown variable neither helps nor hurts. `confidence`
is the share of the 100 points backed by data (a proxy-backed variable counts
only part of its weight, see below; `confidence_from_proxies` is the share that
comes from proxies and `var_<key>__source` says `primary`, `proxy` or null).
No further calibration is applied: PULSE reads directly in the 0-100 scale of
the variables, so 80 means the known variables average a score of 80 (the
distribution is concentrated: half the companies sit between 41 and 64).
`contrib_<key>` splits `pulse` into the points each variable is responsible for.
Everything
after `build` is per company, so a hidden folder is scored exactly as the
training one.

## Cleaning rules (all logged in `data/pulse/cleaning_report.md`)

| Trap | Rule |
|---|---|
| Currencies (44 of them; `exchange_rate` is 1.0 for 43 % of USD rows, has zeros and 6500s) | Every amount is divided by a **fixed FX table** (`fx.py`, units per EUR). Currency = product's, else company's, else EUR. `exchange_rate` columns are ignored. |
| Duplicated transactions | Exact duplicates on (company, product, date, amount, description) dropped: 112,346 rows (4.4 %). |
| Sentinel / absurd amounts | Transaction or invoice dropped when \|amount\| > 20 × the company's own p99 **and** > 1 M EUR (178 tx from 39 companies, 77 invoices worth 1.2 bn), or > 1 bn EUR outright. |
| Balance snapshots (99,999,990,000 EUR, −1 bn) | Cash snapshot discarded (account treated as unanchored) when \|balance\| > 20 × the company's monthly gross flow and > 1 M EUR: 11 accounts. Unanchored accounts are floored so their lowest day is zero (conservative). |
| `value_date` from 2022 to 2099 | Booking `date` is the only date used; `value_date` is replaced when > 30 days away. |
| Invoice dates seeded with corruption | `due_date` kept only if 0 ≤ due − issuance ≤ 365 d (16,356 nulled). `payment_date` trusted only when `status = paid`, pending ≈ 0 and 0 ≤ payment − issuance ≤ 730 d (185 k "overdue" rows carry the due date as payment date; 30,552 settled rows had impossible dates). |
| Document types | Only `invoice` and `invoiceGroup` (123,713 payment documents, notes, delivery notes dropped); `cancel` and zero amounts dropped. |
| Sparse `counterparty_id` in transactions (90 % empty) | Customer variables (#7, #8, #9, #12) use invoice counterparties (98.5 % populated). Bank proxies use `counterparty_ref` = column, else the `COUNTERPARTY_xxxxx` token in the narrative (logged as a cleaning step). |
| Pending / null status | Pending transactions dropped; null status kept (4 companies only have null-status rows). |

Coverage after cleaning: 1,286 companies with transactions, 784 with invoices
(718 with receivables). Median `confidence` is 0.74 with ERP and 0.40 without:
a company with neither ERP nor credit line has #1, #2 and #10 (34 points) plus
whatever the bank proxies below add (median 6 more points); one with a credit
line and ERP reaches 1.0.

## Bank proxies for companies without ERP (`features/bank_proxies.py`)

541 of the 1,286 companies have no ERP, so #5-#9 and #12 are unknown for them.
Bank statements still say who pays the company: the `counterparty_id` column is
filled in 1 % of their transactions, but the narrative carries the
`COUNTERPARTY_xxxxx` token in 28 % of collections and payments, so the cleaning
layer adds `counterparty_ref` = column, else token. Three variables get a
bank-side substitute, computed for **every** company and used only when the
invoice components are all missing:

| # | Proxy component(s) | Definition | Coverage column |
|---|---|---|---|
| 8 | `returned_share` (−, 0 = best), `returned_d3` (−) | returned collections (`collection_refund`) / collections on cash accounts, trailing 3m | none (1.0) |
| 9 | `top_client_growth_bank` (+) | same formula as #9 on collections attributed to a payer | `top_client__proxy_coverage`: attributed share of 12m collections |
| 12 | `network_exposure_bank` (+) | Σ (payer's share of the company's 6m collections) × Δ3m of what that payer pays **other** companies of the portfolio, clipped ±1; payers seen in one company only are skipped | `network__proxy_coverage`: share of 6m collections from payers seen elsewhere |

**Confidence.** A proxy-backed variable carries `proxy_confidence` (0.5) ×
coverage of its weight in both the numerator and the denominator of the score,
so it moves PULSE less than an ERP-backed one and `confidence` drops with it.
A coverage below `MIN_PROXY_COVERAGE` (5 %) leaves the variable unknown. Both
constants live in `variables.py`. Effect on the hackathon data: for company-months
without ERP, #8 is proxy-backed in 76 %, #9 in 27 % and #12 in 30 % of the rows;
the median attributed share of collections is 21 % for #9 and 0.3 % for #12
(placeholders hide most payer names in this synthetic dataset; on real bank
narratives attribution is far higher), so the proxies add a median of 6
confidence points, not the 30 they would add at full confidence.

**Agreement with the ERP truth** (company-months where both are known): Spearman
0.17 between #9 and its proxy, 0.05 for #8, 0.00 for #12. **Anticipation:** the
proxies score 0.46-0.53 AUROC on future stress, like the ERP variables they
replace (see below), and the overall PULSE AUROC is unchanged (0.821). Note that
returned collections are also part of the stress label; `evaluation.json` therefore
carries `auroc_pulse_overdraft_only_label` (0.842), where the label ignores them.

**Counterparty network.** In this dataset a customer ID never appears under two
companies (1 shared ID out of 55,052), so #12 collapses to the company's own
customer-level deterioration. `features/network.py` already pools every company's
invoices per counterparty; set `MIN_COMPANIES = 2` on real Embat data to make it
a true network signal.

## Evaluation (`data/pulse/evaluation.json`)

Stress month = lowest daily cash below zero or a returned direct debit narrative;
label = ≥ 2 stress months in the next 6 (rate 22.4 % over 14,521 company-months
with an observable future). AUROC of PULSE for "no stress ahead": **0.823**
(0.810 on months ≥ 2025-09; 0.829 in a company's first three months). Restricted
to companies **not** stressed today, 0.642 — the honest anticipation number.
By variable: #2 0.870, #1 0.859, #10 0.633; every ERP-side variable (#5-#9,
#12), their bank proxies and the credit-line pair sit at 0.46-0.53, i.e. in this
synthetic dataset they carry no signal about future bank stress. The 36 points
on *cobro* and 12 on *pago* are therefore a design choice, not something these
data support. `auroc_pulse_by_cobro_source` splits the PULSE AUROC by whether
the cobro variables came from invoices (0.771), bank proxies (0.841) or nothing
(0.901): the fewer ERP points dilute the liquidity signal, the higher the AUROC.

## Forecast layer (`pulse/forecast/`)

Monthly PULSE forecasts for +1..+12 months (one year), each with a p10-p90 band
and an exact decomposition of the predicted change into the 11 variables.

```bash
uv run python -m ml_service.pulse.forecast.cli fit        # one model -> data/pulse/models/forecast/{model.txt,model.json}
uv run python -m ml_service.pulse.forecast.cli evaluate   # OOF vs persistence/reversion -> forecast_evaluation.json
uv run python -m ml_service.pulse.forecast.cli predict [--raw-dir DIR] [--all-months]   # -> data/pulse/forecast.{parquet,csv}
uv run python -m ml_service.pulse.export_web              # -> data/pulse/web/ (+ mirror in ../frontend/src/data/pulse)
# summary.json also carries an `evaluation` block (score, forecast and risk figures) read by the web app's method page
```

**Design.** A **single LightGBM model** (`objective=huber`, `alpha=6`) predicts the *change*
of `pulse` between month *t* and *t+h*; the horizon `h` is an ordinary input
column (`HORIZON_FEATURE`), so the training set is every (company-month, horizon)
pair with an observed target stacked together (`features.stack_horizons`) and
extending the horizon is a change in `config.HORIZONS`, not a new model. Persistence
is the starting point and the model only learns deviations. The Huber threshold
`alpha` is expressed in points of PULSE and must sit on the scale of the target
(std 9 at +1, 19 at +12): with LightGBM's default (0.9) every gradient is clipped,
the leaves shrink towards zero and the trees stop splitting on the horizon past
+3, so every trajectory turned into a flat line from +4 on (86 % of the companies
had six or more identical horizons) and the model predicted a spread of 4 points
at +12 against 19 observed. `alpha=6` removes the flat line (the spread at +12 is
7 points, only the last two or three horizons coincide, where the training rows
are scarcest), cuts the MAE from 9.29 to 8.97 and more than doubles the recall of
large improvements; larger values (10, 15) or a plain `l2` objective are slightly
worse, and a random forest on the same inputs (MAE 9.26) also flattens the far
horizons. The p10-p90 band is
**conformal**: the 10th/90th percentile of the out-of-fold residual at each horizon
(GroupKFold(5) on `group_id`, computed inside `fit`) is added to the central
forecast, which keeps the 80 % coverage honest without extra quantile models; the
offsets are stored in `model.json` and grow with the horizon (≈ ±8 points at +1,
≈ −19/+18 at +12). Inputs (`forecast/features.py`): the 11 variables and their
percentiles, Δ1/Δ3/Δ6 and 6-month volatility of every level, the four pillars and
PULSE itself, cash-account flows (inflows, net 3m/6m, growth), the invoice calendar
(AR/AP already due within 1/3/6 months, open overdue amounts), stress narratives
(returned debits, overdrafts), intragroup inflow share, group mean PULSE,
observation length and the horizon. The per-feature contributions returned by
LightGBM (`pred_contrib`) are folded into the 11 variables
(`forecast/attribution.py`): component-derived features go to their variable,
pillar-level features are split by weight inside the pillar, PULSE-level features
across all variables by weight, everything else is reported as `contexto`, and the
bias plus the horizon input (the drift the model expects at that distance) as
`base`. The parts sum to `delta` to 1e-14. The forecast is PULSE now plus `delta`,
clipped to 0-100, and the band is clipped the same way.

**Evaluation** (`data/pulse/forecast_evaluation.json`, GroupKFold(5) on
`group_id`, one fit of the single model per fold, MAE in points of PULSE).
"Reversion" is a one-parameter mean-reversion baseline fitted out of fold;
anything that does not beat it is just percentiles drifting back to the middle.
Over the 169,691 stacked (company-month, horizon) rows the model's MAE is 8.97
against 11.11 for persistence (+19.2 %) and 10.59 for reversion (+15.3 %), with
80.0 % of the outcomes inside the p10-p90 band.

| horizon | rows | persist | reversion | ML | vs persist | vs reversion | direction on moves > 15 | recall declines | recall improvements | p10-p90 coverage |
|---|---|---|---|---|---|---|---|---|---|---|
| +1 | 20,932 | 5.72 | 5.89 | **5.66** | +1.1 % | +4.0 % | 0.86 | 0.53 | 0.46 | 0.80 |
| +2 | 19,647 | 8.47 | 8.35 | **7.30** | +13.7 % | +12.5 % | 0.89 | 0.67 | 0.56 | 0.80 |
| +3 | 18,362 | 10.52 | 9.99 | **8.39** | +20.3 % | +16.0 % | 0.90 | 0.74 | 0.62 | 0.80 |
| +4 | 17,077 | 11.20 | 10.53 | **8.81** | +21.4 % | +16.4 % | 0.90 | 0.76 | 0.62 | 0.80 |
| +5 | 15,795 | 11.83 | 11.02 | **9.24** | +21.9 % | +16.1 % | 0.90 | 0.77 | 0.61 | 0.80 |
| +6 | 14,514 | 12.35 | 11.41 | **9.64** | +21.9 % | +15.6 % | 0.90 | 0.79 | 0.60 | 0.80 |
| +7 | 13,240 | 12.70 | 11.66 | **10.00** | +21.3 % | +14.3 % | 0.89 | 0.79 | 0.63 | 0.80 |
| +8 | 12,044 | 12.97 | 11.87 | **10.32** | +20.4 % | +13.1 % | 0.89 | 0.79 | 0.63 | 0.80 |
| +9 | 10,980 | 13.27 | 12.06 | **10.59** | +20.2 % | +12.3 % | 0.89 | 0.80 | 0.62 | 0.80 |
| +10 | 9,980 | 13.67 | 12.30 | **10.83** | +20.8 % | +12.0 % | 0.89 | 0.80 | 0.57 | 0.80 |
| +11 | 9,018 | 14.00 | 12.46 | **11.02** | +21.3 % | +11.6 % | 0.90 | 0.81 | 0.58 | 0.80 |
| +12 | 8,102 | 14.27 | 12.62 | **11.10** | +22.2 % | +12.1 % | 0.90 | 0.81 | 0.58 | 0.80 |

The single model beats the previous one-model-per-horizon setup at every horizon
(for example 9.64 vs 10.33 at +6) because the horizons share what they learn,
and it sees recoveries almost as well as declines (recall 0.58 vs 0.81 at one
year); at +1 it only matches persistence. The temporal backtest (fit on months up
to 2025-08, test from 2025-09) tells the same story: MAE 5.67 vs 5.69 persistence
at +1, 10.02 vs 12.14 at +6, 12.08 vs 14.25 at +11 (+12 has no observable future
after the cut). Read the forecast as an early warning with a wide band, not as a
promise: the p10-p90 band spans about 35 points at one year.
A preliminary experiment forecasting each pillar separately showed that *cobro*
and *pago* pillar forecasts do not beat the reversion baseline, which is why only
PULSE itself is modelled and the breakdown comes from attribution rather than
from per-variable models. The `horizon` input ranks third by gain (4.9 %) after
`pulse` and `pillar_cobro`. Horizons are scored independently at
prediction time, so a company's trajectory is not forced to be monotone.

**API.** `GET /api/pulse/summary` and `GET /api/pulse/companies/{company_id}`
serve the files written by `export_web.py` (`routes_pulse.py`); the contract is
the JSON described in the frontend data layer (`frontend/src/lib/pulse`).

## PULSE Advisor: product recommendations priced from PULSE (`pulse/recommend/`)

Given a company's latest PULSE snapshot, the advisor decides **which financial
products fit its situation, how much to offer and at what rate**, and explains
every step in Spanish so the company understands why it is being offered what
it is being offered. It is rule-based where the decision must be auditable
(eligibility, sizing) and uses a small ML model where a probability is needed
(the risk premium in the price).

```bash
uv run python -m ml_service.pulse.recommend.cli fit     # stress scorecard -> data/pulse/models/risk_model.json + risk_evaluation.json
uv run python -m ml_service.pulse.recommend.cli build   # every company -> data/pulse/recommendations/{summary.json,catalogue.json,companies/<id>.json}
#   (+ mirror of catalogue.json and companies/ in ../frontend/src/data/pulse/recommendations)
uv run python -m ml_service.pulse.recommend.cli show COMP_1030   # human-readable narrative for one company
make pulse-reco-all                                     # fit + build
```

Inputs (`recommend/inputs.py`, `inputs_raw.py`): the last month of
`scored_panel.parquet` (PULSE, pillars, the 11 variables with raw values,
`cash_end`, trailing outflows/collections/debt service), the +12 month forecast,
the company's current facilities from `debt_products.csv` and
`debt_schedule_config.csv` (line limit and drawn, loans outstanding, median
rate) and its open invoices from the cleaned ERP data (open and *current*
receivables, monthly billing and purchases).

### Catalogue (`recommend/catalogue.py`)

The products are the ones the portfolio already uses (`debt_products.csv`:
loan 1,022, lineofcredit 536, confirming 229, factoring 24) plus a deposit for
the companies with idle cash. Each carries a base margin and a loss given
default that the pricing quotes.

| key | product | when it fits (rule file) | sizing |
|---|---|---|---|
| `credit_line` | Línea de crédito | cash days < 30 or intramonth minimum < 0.25 months, no idle line, PULSE ≥ 30 (`rules_liquidity.py`) | 0.35-1.5 months of outflow by PULSE band, net of available line |
| `credit_line_increase` | Ampliación de línea | existing line drawn ≥ 80 %, PULSE ≥ 30 | +15/30/50 % of the limit by PULSE band |
| `factoring` | Anticipo de facturas | ERP receivables ≥ 20 k€ not > 90 d overdue, +90 d bucket ≤ 40 %, DSO > 45 favours it, PULSE ≥ 20 (`rules_receivables.py`) | 75-85 % of current receivables, cap 3 months of billing |
| `confirming` | Confirming de proveedores | ERP purchases ≥ 15 k€/month, short supplier terms (< 20 d) or paying late, PULSE ≥ 30 (`rules_payables.py`) | 1.5 months of purchases |
| `term_loan` | Préstamo a plazo | PULSE ≥ 60, maturities/cash < 1, balanced cash (`rules_debt.py`) | 3 months of collections × 70-100 %, 48 months |
| `refinancing` | Reestructuración de vencimientos | debt outstanding and 6-month service ≥ 1× cash (≥ 3× severe), PULSE ≥ 15 (`rules_refinancing.py`) | loans outstanding (or 12 months of service), 60 months |
| `treasury_deposit` | Depósito de excedentes | cash days ≥ 180, intramonth minimum ≥ 1 month, no maturity pressure, excess ≥ 50 k€ after a 90-day buffer (`rules_treasury.py`) | cash − 90 days of outflow; 3/6/12 months by cash days |

Every rule returns an `Assessment`: a list of `Reason`s (`pro`, `contra` or
`bloqueo`), each tied to the PULSE variable, the raw value and the threshold it
was compared against, and a **fit** = 30 + Σ points, 0-100. A product with a
blocker is never offered; eligible products with fit ≥ 40 are ranked and the top
three are priced. Blocked and low-fit products are reported under `declined`
with their reasons, so the company also sees *why not* factoring, for example.
Thresholds live in `recommend/config.py`.

### Price (`recommend/pricing.py`)

```
diferencial = margen del producto             (90-200 pb by product)
            + prima de riesgo                 = PD12m × 25 % (stress -> default) × LGD, cap 900 pb
            + prima por incertidumbre de datos = 75 pb × (1 − confidence)
            + ajuste por tendencia            (+25 pb if the +12 m forecast drops ≥ 5 points, −15 pb if it rises ≥ 5)
            [+ 25 pb si la línea actual está al ≥ 90 %]
tipo        = tipo sin riesgo + diferencial        (floored at 0)
```

The spread is computed and clamped to the product's band (`min/max_spread_bps`
in the catalogue) **before** the reference rate is added, so it never depends
on the Euríbor: the static export is priced over `PULSE_EURIBOR_12M` (default
2.10 %) and any API call can re-quote the same recommendation over another
risk-free rate with `?euribor=0.03`. The deposit reads the same table as a yield
(Euríbor − 60 pb, +15 pb when cash covers a year of outflows, capped at the
reference). The payload lists every component with its basis points and a
one-line justification, and says when the clamp applied. For `plazo` products it also compares with the median
rate of the company's current loans and gives the monthly instalment.

**PD12m** comes from `recommend/risk.py`: a standardised logistic regression on
the four pillars, `confidence` and log(months observed), trained on the same
stress label as `evaluate.py` (≥ 2 stress months in the next 6) with
GroupKFold(5) on `group_id`. Any coefficient whose sign would mean "healthier is
riskier" is zeroed and the model refitted (monotone guard), so improving a pillar
can never raise the premium. Out-of-fold AUROC **0.871** (PULSE alone: 0.823),
mean predicted 0.223 vs observed 0.224 (`data/pulse/risk_evaluation.json`).
Standardised coefficients: liquidez −1.91, deuda −0.15, cobro −0.10, pago 0
(no signal in this dataset), confidence −0.03, log months −0.36. Being linear in
log-odds, `risk.contributions` splits each company's logit exactly by input.

### Levers (`recommend/levers.py`) and narrative (`recommend/explain.py`)

For each offer, the pillars below 60 are moved to 60 one at a time through the
risk model, and the payload reports the new stress probability and the premium
saved in basis points, together with the weakest variables of that pillar (so
the company reads "si tu pilar de liquidez subiera de 23 a 60, la prima bajaría
502 pb; las variables que más pesan: días de caja (20/100)…"). The same levers
plus the products blocked only by the PULSE minimum ("se desbloquea con un
PULSE de 30, hoy 11") form the company-level `improvement_plan`, which is the
answer for companies that get no product today.

### Results on the hackathon data (`data/pulse/recommendations/`)

| top product | companies | rate q1 / median / q3 |
|---|---|---|
| credit_line | 365 | 4.86 / 5.65 / 7.77 % |
| treasury_deposit | 152 | 1.50 / 1.65 / 1.65 % (yield) |
| confirming | 89 | 3.59 / 4.06 / 5.54 % |
| refinancing | 80 | 6.43 / 8.15 / 10.67 % |
| factoring | 49 | 3.96 / 4.85 / 5.97 % |
| term_loan | 31 | 4.54 / 4.82 / 5.12 % |
| credit_line_increase | 4 | 3.79 / 4.57 / 6.15 % |
| none | 515 | 379 of them get at least one "unlock", 458 a quantified lever |

Most companies without an offer have PULSE < 30 (403) or no activity in the
window; that is by design (no new credit for a company already in stress),
which is why the improvement plan is part of the payload.

### API (`api/routes_recommend.py`)

| Method | Path | Returns |
|---|---|---|
| GET | `/api/pulse/recommendations/catalogue` | products (with their spread bands), pricing parameters, reference rate, risk-model evaluation |
| GET | `/api/pulse/recommendations?product=&limit=&euribor=` | one row per company (`top_product`, `top_amount`, `top_annual_rate`, `top_spread_bps`, `top_fit`, `p_stress_6m`, `headline`) sorted by fit, plus `by_top_product` counts |
| GET | `/api/pulse/recommendations/{company_id}?euribor=` | the full payload below |

`euribor` (annual decimal, −1 % to 25 %) re-prices on the fly: the API loads
`recommendations/snapshots.json` (the inputs of every recommendation, written
by `build`) and `models/risk_model.json` once per process
(`api/advisor_runtime.py`) and recomputes the recommendation over that rate.
Spreads, amounts, reasons and levers are identical; only the reference line,
the final rate, the headline and the price story change, and the payload's
`reference_rate.source` says `request` instead of `default`. Without the
parameter the static files are served.

```jsonc
{
  "company_id": "COMP_1030", "month": "2026-08", "pulse": 39.2, "confidence": 0.68, "pillars": {...},
  "reference_rate": {"label": "Euríbor 12 m", "value": 0.021, "source": "default"},
  "summary": "PULSE 39 (2026-08), cobertura de datos 68%: 2 producto(s) encajan con tu situación.",
  "risk": {"p_stress_6m": 0.31, "base_rate": 0.22, "contributions": [{"feature": "pillar_liquidez", "label": "Pilar liquidez", "value": 23.1, "logit": 1.9}, ...]},
  "recommendations": [{
    "rank": 1, "product": "credit_line", "label": "Línea de crédito", "family": "circulante", "what": "...", "fit": 75,
    "amount": 140000, "tenor_months": 12, "monthly_instalment": null, "rate_kind": "cost", "annual_rate": 0.097, "spread_bps": 760,
    "headline": "Línea de crédito de 140.000 € a 12 meses, a un tipo del 9.70% anual.",
    "why": ["Tu caja a cierre de mes cubre solo 3 días de pagos operativos (umbral 30).", ...],
    "reasons": [{"code": "caja_corta", "text": "...", "kind": "pro", "points": 25, "variable": "cash_days", "value": 3.1, "unit": "días"}, ...],
    "sizing": {"formula": "0.60 meses de pagos operativos (233.000 €/mes, PULSE 39) menos ...", "inputs": {...}},
    "pricing": {"components": [{"key": "referencia", "label": "Euríbor 12 m", "bps": 210, "detail": "..."}, ...],
                "clamped": false, "reference_rate": 0.021, "spread_band_bps": [40, 990], "annual_pd": 0.52, "expected_loss_bps": 586, "story": ["..."]},
    "levers": [{"pillar": "liquidez", "current": 23.1, "target": 60, "p_stress_now": 0.31, "p_stress_then": 0.04, "premium_saving_bps": 502, "variables": [...]}],
    "lever_story": ["Si tu pilar de liquidez subiera de 23 a 60, ..."]
  }],
  "declined": [{"product": "factoring", "label": "...", "status": "no_elegible", "reasons": ["No vemos facturas de clientes suficientes ..."]}, ...],
  "improvement_plan": {"unlocks": ["Préstamo a plazo: se desbloquea con un PULSE de 60 (hoy 39)."], "levers": [...], "story": [...]},
  "inputs": {"cash_end": ..., "monthly_outflow": ..., "holdings": {...}, "invoices": {...}, "outlook": {...}, "variables": {...}},
  "disclaimer": "Propuesta orientativa ..."
}
```

The files are static, like the PULSE export: rerun `recommend.cli build` after
`pulse.cli fit` / `forecast.cli predict`.
