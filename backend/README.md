# backend (ml-service)

Python service of HackSpain 2026. It implements the domain logic and the
ML-based analysis consumed by the web app in [`../frontend`](../frontend).

Stack: Python 3.12, [uv](https://docs.astral.sh/uv/), pytest, Ruff. Guidelines
for AI coding assistants live in [`AGENTS.md`](./AGENTS.md).

## Setup

```bash
# Install uv (once)
curl -LsSf https://astral.sh/uv/install.sh | sh

cd backend
uv sync          # creates .venv and installs runtime + dev dependencies
cp .env.example .env
```

## Commands

```bash
make main              # Run the service entry point
make test              # Unit + integration tests
make test-unit         # Unit tests only (tests/unit)
make format            # Ruff format
make lint              # Ruff check
make pre-commit        # Unit tests + format + lint

make xray-panel        # Build the monthly feature panel from data/raw/xray
make xray-train        # Fit + persist the score engine (group-wise CV on)
make xray-evaluate     # Group CV + temporal backtest + stability report
make xray-score RAW=/path/to/hidden_test   # Score an unseen dataset folder
make xray-all          # panel -> train -> evaluate
```

---

# X-Ray: SME financial-health score

A 0-100 financial-health score per company and per month, built from 24 months
of bank transactions, ERP invoices, debt products and balance snapshots
(2024-09 → 2026-08, 1,286 companies, 250 groups). There are no labels in the
dataset: the forward-looking part of the score is **self-supervised** on stress
events the companies themselves exhibit later in their own history.

## Architecture

```
data/raw/xray/*.csv                       (8 tables, see data_dictionary.md)
        │
        │  io.Dataset            CSV -> Parquet cache (per raw folder)
        ▼
 features/transactions.py   flows, reconstructed daily/monthly balances,
 features/invoices.py       DSO/DPO, point-in-time overdue stock, HHI
 features/debt.py           outstanding, granted, rates
        │
        │  features/panel.py     dense company x month grid + rolling windows
        ▼  features/ratios.py    scale-free ratios  -> data/features/panel.parquet
 ┌──────────────────────────────────────────────────────────────────────┐
 │  score/normalize.py   raw feature -> empirical percentile (0-1),     │
 │                       sign-aligned "higher = healthier", ties at the  │
 │                       mid-rank, unknowns -> 0.5 + `__known` flag      │
 │  score/composite.py   6 weighted pillars -> `composite` (0-100)       │
 │  score/targets.py     self-supervised y_stress / y_future_composite   │
 │  score/model.py       2 LightGBM boosters, monotone constraints,      │
 │                       GroupKFold(5) on group_id -> honest OOF         │
 │  score/scoring.py     blend level + forward + risk, PDO scaling,      │
 │                       percentile calibration, EWMA, Theil-Sen trend   │
 │  score/regime.py      PELT changepoints -> transient vs structural    │
 └──────────────────────────────────────────────────────────────────────┘
        │  score/pipeline.py  ScoreEngine.fit / .score / .save / .load
        ▼
 data/models/{normalizer.json,stress.txt,future.txt,calibration.json}
 data/output/{scored_panel.parquet,oof.parquet,submission.csv,xray_export.json}
        │
        ├─ evaluate.py + metrics.py + backtest.py + stability.py -> evaluation.json
        ├─ explain/  monitor/  anticipation/   (reasons, alerts, lead time)
        └─ export.py -> JSON contract consumed by ../frontend
```

Everything downstream of the panel is **per company**: a company's score depends
only on its own rows plus the frozen artefacts in `data/models/`. That is what
makes scoring an unseen folder (the hidden test) exactly reproducible.

## Pillars and features

`composite` is a weighted mean of six pillar sub-scores; each pillar is a
weighted mean of its normalised features (features with no data are skipped and
their weight is removed from the denominator). `direction` is +1 when a higher
raw value is healthier and -1 otherwise; normalisation flips the -1 features so
that every normalised column reads "higher = healthier".

| Pillar (weight) | Feature | Dir | Meaning |
|---|---|---|---|
| **liquidity** (0.26) | `cash_runway_months` | +1 | cash / average monthly outflow (3m) |
| | `cash_to_inflow` | +1 | cash / average monthly inflow (3m) |
| | `neg_balance_share` | −1 | share of days with a negative balance |
| | `min_balance_ratio` | +1 | lowest intra-month balance / outflow |
| | `cash_change_3m` | +1 | cash change over 3 months, scaled |
| **cashflow** (0.20) | `net_margin` | +1 | (inflow − outflow) / (inflow + outflow) |
| | `net_margin_3m` | +1 | same over a trailing quarter |
| | `inflow_growth_3m` | +1 | log growth of 3m inflows vs previous 3m |
| | `inflow_growth_6m` | +1 | log growth of 6m inflows vs previous 6m |
| | `inflow_volatility` | −1 | std of net cash flow / average inflow |
| | `net_positive_share_6m` | +1 | months with positive net cash in the last 6 |
| **payments** (0.20) | `returned_debit_rate` | −1 | returned direct debits per 100 transactions |
| | `stress_event_rate` | −1 | overdraft / late-fee / seizure narratives |
| | `supplier_delay_days` | −1 | value-weighted days beyond terms paid to suppliers |
| | `payables_overdue_share` | −1 | overdue payables / payables issued (6m) |
| | `tax_regularity` | +1 | share of the last 6 months with tax/TGSS payments |
| **receivables** (0.14) | `dso_days` | −1 | value-weighted collection delay |
| | `receivables_overdue_share` | −1 | overdue receivables / receivables issued (6m) |
| | `customer_concentration` | −1 | HHI of customers over a 3-month window |
| | `collection_growth_3m` | +1 | log growth of collections |
| **debt** (0.12) | `loc_utilization` | −1 | drawn / granted on credit lines |
| | `debt_service_ratio` | −1 | debt repayments / inflows (3m) |
| | `financing_cost_ratio` | −1 | interest + fees / inflows (3m) |
| | `leverage_ratio` | −1 | debt outstanding / annualised inflows |
| | `loc_util_change_3m` | −1 | change in credit-line utilisation |
| **activity** (0.08) | `activity_growth_3m` | +1 | log growth of transaction count |
| | `payroll_growth_3m` | +1 | log growth of payroll |
| | `counterparty_growth_3m` | +1 | log growth of distinct counterparties |

Features that carry more evidence get a higher weight inside their pillar
(`neg_balance_share`, `payables_overdue_share`, `loc_utilization` ×2;
`cash_runway_months`, `min_balance_ratio`, `returned_debit_rate`,
`receivables_overdue_share`, `net_positive_share_6m` ×1.5).

## The self-supervised target

No labels ship with the dataset, so the forward view is trained on stress the
company itself shows later (`score/targets.py`, horizon **H = 6 months**):

- a month is **stressful** if any of: negative month-end cash, ≥1 returned
  direct debit, ≥1 overdraft/late-fee/seizure narrative, payables overdue share
  > 0.75, credit-line utilisation > 0.95, or > 50 % of days with a negative
  balance (a missing input reads as "no stress", never as null);
- `y_stress` = **at least two** stressful months inside `(t, t+6]` (two months,
  not one, so that an isolated bad month is not a label);
- `y_future_composite` = the pillar composite at `t+6`;
- `has_future` marks the rows whose full horizon is observable — only those are
  trained on. The label never includes month `t` itself.

## How the score is built

1. **Normalise** every feature to its empirical percentile on the training
   distribution (1,001-point quantile grid). Ties use the *mid-rank*, so a
   feature that is 0 for 90 % of companies (e.g. returned debits) maps a zero to
   ≈ 0.55 — "typical", not "perfect". Unknowns become 0.5 and are flagged.
2. **Pillars → composite** (0-100), the transparent, model-free level.
3. **Two LightGBM boosters** (`objective=binary` for `y_stress`,
   `objective=regression` for `y_future_composite`), both with **monotone
   constraints** in each feature's economic direction, so the model can never
   learn that more overdue payables is healthier. Validation is `GroupKFold(5)`
   **on `group_id`**, which mimics the hidden test of unseen companies.
4. **Blend** (`score/scoring.py`):
   `score_raw = 0.45 · composite + 0.35 · E[composite at t+6] + 0.20 · PDO(p_stress)`
   where `PDO(p) = 60 + (12/ln 2) · ln((1−p)/p) − (12/ln 2) · ln 3` clipped to
   0-100 — the classic scorecard scaling: every 12 points doubles the odds of
   *not* hitting stress.
5. **Calibrate** the blend to its training percentile and stretch it to 3-97, so
   the portfolio always uses the full range.
6. **Smooth**: `score` is an EWMA (α = 0.6) of `score_raw` per company — one bad
   month moves the score less than a persistent deterioration.
7. **Trajectory**: `trend_6m` is a **Theil-Sen** (robust) slope over the trailing
   6 scores, discretised into `direction` ∈ {improving, stable, deteriorating}
   at ±1.5 points/month.
8. **Regimes**: PELT (`ruptures`, L2 cost, penalty 250) re-estimated **on the
   prefix of each month**, so the label at month *m* never uses later data. A
   shift ≥ 8 points that persists ≥ 2 months is `structural_decline` /
   `structural_improvement`; a dip that reverts within 3 months is
   `transient_dip` / `transient_spike`; otherwise `steady`.

## Evaluation protocol and results

`evaluate.py` (`make xray-evaluate`, writes `data/output/evaluation.json`) runs
three blocks. Numbers below are from the full 1,286-company panel.

**1. Group-wise cross-validation** — `GroupKFold(5)` on `group_id`, so every
prediction is made for a company whose *whole group* was held out. This is the
honest proxy for the hidden test set.

**2. Temporal backtest** — the engine (normaliser, pillars, boosters,
calibration) is refitted on months **≤ 2025-08 only**, with targets built on the
truncated panel: a training row is labelled only when its whole 6-month horizon
falls inside the training window, so the last labelled training month is
**2025-02** and the first evaluated month is **2025-09** — a 6-month purge gap
between the training labels and the test rows. Evaluation rows: 2025-09 → 2026-02
(the last months have no observable future).

| split | rows | stress rate | AUROC | PR-AUC | ρ(future composite) | ρ(6m change) | sign agr. | improver recall | decliner recall |
|---|---|---|---|---|---|---|---|---|---|
| group CV (5-fold on group_id) | 17,244 | 0.389 | **0.872** | 0.836 | 0.519 | 0.611 | 0.714 | 0.752 (n=3,412) | 0.863 (n=5,814) |
| temporal backtest (train ≤ 2025-08) | 6,974 | 0.383 | **0.874** | 0.834 | 0.520 | 0.612 | 0.716 | 0.705 (n=1,526) | 0.898 (n=2,298) |

"improver / decliner recall" is the both-directions check: among rows whose
realised 6-month composite change was **> +5 points** (improvers) or
**< −5 points** (decliners), the share the model also called in that direction.
The engine is better at calling deteriorations than recoveries, which is the
useful asymmetry for a treasury early-warning product.

The backtest matches the cross-validated numbers, so the engine does not depend
on having seen the months it scores. Naive baselines on the same OOF rows
(AUROC for `y_stress`): current stress state alone 0.778, pillar composite alone
0.703, `cash_runway_months` 0.616 — the forward model adds ~0.09 AUROC over "the
company is already in trouble". All numbers above are the contents of
`data/output/evaluation.json`; rerun `make xray-evaluate` after any refit to
refresh them.

**Calibration** (deciles of `p_stress`, group CV):

| decile | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| mean p | 0.033 | 0.065 | 0.095 | 0.131 | 0.189 | 0.289 | 0.469 | 0.731 | 0.896 | 0.957 |
| realised | 0.054 | 0.094 | 0.114 | 0.132 | 0.205 | 0.300 | 0.479 | 0.700 | 0.859 | 0.955 |

Monotone throughout and close to the diagonal in every decile (largest gap:
0.731 predicted vs 0.700 realised). The temporal backtest is visibly more
over-confident in the middle deciles (e.g. 0.566 predicted vs 0.476 realised,
0.814 vs 0.699) — ranking transfers across time better than absolute
probabilities do, so the demo should lean on the score and the ordering rather
than on `p_stress` read as a literal percentage.

**3. Stability** of the published score:

| metric | value |
|---|---|
| PSI of the score distribution, month over month | mean 0.011, max 0.027 (2024-11) |
| mean absolute month-over-month score change | 5.50 points (p95 17.0, max 57.5) |
| companies flipping `direction` more than 3× in 12 months | 32.2 % (mean 2.86 flips) |

No month comes anywhere near the usual 0.1 PSI alarm line, so the population is
stable end to end. Individual scores are still jumpy though: 5.5 points of
average monthly movement and a third of the portfolio changing trend label more
than three times a year. If the demo needs calmer trajectories, lower
`SMOOTH_ALPHA` (0.6) or widen the ±1.5 points/month `direction` band.

### Hidden-test simulation

`make xray-score RAW=...` was validated end to end on a 30-company copy of the
raw folder (every CSV filtered to 30 `company_id`s). Result: 640 company-months,
and **every score, `p_stress`, `direction` and `regime` identical to the
full-panel run (max absolute difference 0.0)**. Nothing in the scoring path is
population-relative at inference time — the quantile grids and the calibration
grid are frozen inside `data/models/` — so a 60-80 company hidden set is scored
exactly as if those companies had been part of the training folder.

### Known data artefacts (read before trusting a number)

Fixed since the first evaluation round (kept here because they explain the jump
in the numbers above):

- **`payment_date` on unpaid invoices** — the ERP fills it with the due date on
  documents that were never settled (only 6 of 897,894 rows are null, yet
  192,556 carry `status = "overdue"` with `pending_amount = amount`).
  `features/invoices.py` now trusts a payment date only when
  `status == "paid"` **and** `pending_amount ≈ 0`.
- **Final-month score inflation** — the old rule made the overdue stock
  evaporate at the edge of the panel and inflated the mean score to 56.3 in
  2026-08. With the fix, `overdue_ar` stays at ~17 M in 2026-08 and the mean
  score ends at 47.2 (overall mean 50.4): the last month is no longer a
  systematic free pass.
- **Overdue-window off-by-one** — the month range stopped one month early;
  the stop index is now `+1`, so an invoice is overdue up to and including the
  month before it settles, and an invoice still open at extraction counts in
  2026-08.
- **Pivot fragility** — `features/panel.py` gained `_ensure_columns` guards, so
  a hidden folder without payable invoices, without debt products or with one
  invoice side missing no longer raises `ColumnNotFoundError` (the ratios moved
  to `features/ratios.py::add_ratios` in the same change).

Still live, by design or by data limitation:

- **Onboarding ramp.** Products are connected progressively: mean transactions
  per company-month go from ~58 (2024-09) to ~107 (2026-08), and the panel
  starts at each company's first active month (median 23 months, min 4). The
  6-month denominators (`issued_ap_6m`, `issued_ar_6m`) and the rolling windows
  are therefore thin at the start, which makes early months look clean: the mean
  score is 59.4 at month 1 and decays to ~54 by month 6 against an overall mean
  of 50.4. `months_observed` is a model feature with a neutral monotone
  constraint, but it only partly absorbs this — treat a company's first months
  as low-confidence, not as healthy.
- **Unanchored balance floor.** Accounts whose `balances.csv` snapshot is
  missing (209 cash products) or exactly zero while still active (968) have no
  anchor for the reconstructed series, so `reconstruct_balances` shifts them up
  until their lowest daily balance is zero. That is deliberately conservative,
  but it means those accounts can never show an overdraft: `neg_balance_share`,
  `min_balance_ratio` and the `cash_end < 0` stress rule under-report stress for
  them (panel-wide, 16.1 % of company-months have any negative day and 5.0 % end
  the month negative).
- **Sparse inputs.** `loc_utilization` is unknown for 90.9 % of company-months
  (`loc_util_change_3m` 92.7 %), so the debt pillar rests mostly on
  `debt_service_ratio` / `leverage_ratio`. `dso_days` is unknown for 59.9 %
  (stricter now that only genuinely settled invoices carry a delay) and
  `customer_concentration` for 44.2 %. Unknowns score a neutral 0.5 and are
  excluded from their pillar's weight, so they neither help nor hurt — but a
  company with three pillars of unknowns has a score built on thin evidence.

## CLI

```bash
uv run python -m ml_service.xray.cli build-panel [--raw-dir DIR] [--cache-dir DIR] [--out FILE]
uv run python -m ml_service.xray.cli train [--panel FILE] [--models DIR] [--no-cv]
uv run python -m ml_service.xray.cli score --raw-dir DIR [--cache-dir DIR] [--models DIR] \
        [--out-json FILE] [--out-csv FILE] [--no-explain]
uv run python -m ml_service.xray.cli evaluate [--panel FILE] [--out FILE]
```

`score` is the hidden-test entry point: it needs **only** the unseen CSV folder
and `data/models/`, never the training data. It builds that folder's panel,
loads the persisted engine, writes the leaderboard CSV
(`company_id, month, score, p_stress, trend_6m, direction, regime`) and the full
JSON export. `--no-explain` skips the SHAP pass when only the CSV is needed.

It writes to `data/output/submission.csv` and `data/output/xray_export.json` by
default, which would overwrite the demo export of the training run — pass
`OUT_CSV=` / `OUT_JSON=` (or `--out-csv` / `--out-json`) to keep them apart, and
`--cache-dir` to keep the hidden folder's Parquet cache separate.

## JSON contract consumed by `../frontend`

`export.py` writes one payload (`data/output/xray_export.json`); `run_export.py`
additionally splits it into `summary.json` + `companies/<company_id>.json` under
`data/output/web/` and mirrors it into `frontend/src/data/xray/`.

```jsonc
{
  "generated_for": "HackSpain 2026 · Embat X-Ray",
  "pillar_labels":  { "liquidity": "Liquidez", ... },      // es-ES labels
  "feature_labels": { "cash_runway_months": "Meses de caja disponibles", ... },
  "regime_labels":  { "structural_decline": "...", ... },
  "companies": [
    {
      "company_id": "COMP_0001",
      "group_id": "GROUP_001",
      "months_observed": 24,
      "score": 69.02,            // latest month, 0-100
      "score_prev": 47.93,       // previous month
      "score_6m_ago": 48.69,
      "trend_6m": 3.1,           // Theil-Sen slope, points per month
      "direction": "improving",  // improving | stable | deteriorating
      "regime": "structural_improvement",
      "p_stress": 0.07,          // P(stress in the next 6 months)
      "pillars": { "liquidity": 61.2, "cashflow": 55.0, ... },
      "reasons": [               // SHAP, harmful first; empty without explain_rows
        { "feature": "dso_days", "label": "Retraso medio de cobro (DSO)",
          "pillar": "receivables", "impact": -1.64, "value": 12.17 }
      ],
      "explanation": {           // added by explain/ (other agent)
        "month": "2026-08", "score": 69.02, "score_prev": 47.93,
        "score_ref": 48.69, "reference_month": "2026-02", "window_months": 6,
        "waterfall": [ { "feature": "payables_overdue_share", "label": "...",
                         "pillar": "payments", "delta_points": 5.35,
                         "value_before": 0.13, "value_after": 0.0 } ],
        "waterfall_1m": [ ... ],
        "narrative_es": "El score subió 20 puntos (49→69) desde febrero de 2026.",
        "narrative_1m_es": "...",
        "regime_text_es": "Mejora estructural: ..."
      },
      "series": [                // one entry per month, oldest first
        {
          "month": "2024-09",
          "score": 57.05, "score_raw": 57.05, "composite": 54.1,
          "p_stress": 0.21, "trend_6m": null,
          "direction": "stable", "regime": "steady",
          "regime_shift": 0.0, "changepoint_month": null,
          "pillars": { "liquidity": 52.0, ... },
          "raw": { "inflow": 1.2e5, "outflow": 9.8e4, "net": 2.2e4,
                   "cash_end": 3.1e4, "cash_min": 1.0e4, "dso_days": 12.2,
                   "supplier_delay_days": 4.0, "overdue_ar": 0.0,
                   "overdue_ap": 0.0, "loc_utilization": null,
                   "returned_debit_n": 0, "stress_n": 0, "n_tx": 88,
                   "n_counterparties": 9, "debt_outstanding": 0.0,
                   "payroll": 2.0e4, "tax_paid": 5.0e3 },
          "reasons": [ ... ],
          "stress_now": 0
        }
      ]
    }
  ]
}
```

The `alerts`, `anticipation` and `explanation` keys are produced by the
`monitor/`, `anticipation/` and `explain/` packages and are added to the payload
by `run_export.py`; `export.py` merges anything passed in its `extra` argument
at the top level. Numbers are rounded to 4 decimals and `NaN` is emitted as
`null`.

## Structure

```
backend/
├── src/ml_service/
│   ├── main.py             # service entry point
│   └── xray/               # the X-Ray engine
│       ├── config.py       # paths, FEATURE_SPECS, PILLARS, stress regexes
│       ├── io.py           # Dataset: raw CSV folder -> Parquet cache
│       ├── features/       # transactions, invoices, debt, ratios, panel
│       ├── score/          # normalize, composite, targets, model, scoring,
│       │                   # regime, pipeline (ScoreEngine)
│       ├── explain/        # SHAP attribution, reasons, es-ES narratives
│       ├── monitor/        # alerts
│       ├── anticipation/   # lead-time measurement
│       ├── metrics.py      # AUROC / PR-AUC / Spearman / calibration
│       ├── stability.py    # PSI, score churn, direction flips
│       ├── backtest.py     # purged temporal backtest
│       ├── evaluate.py     # evaluate_all() -> data/output/evaluation.json
│       ├── export.py       # JSON + submission CSV
│       └── cli.py          # build-panel | train | score | evaluate
├── tests/unit/             # fast, deterministic unit tests
├── data/                   # raw (symlink), parquet, features, models, output
├── pyproject.toml
├── Makefile
└── AGENTS.md
```

`data/` is git-ignored; `data/raw/xray` is a symlink to the challenge CSV folder.

## Dependencies

```bash
uv add <package>          # runtime dependency
uv add --dev <package>    # dev dependency
uv lock --upgrade         # refresh the lock file
```

## API (FastAPI)

The HTTP layer lives in `src/ml_service/api/` and is the **cross-app contract**
with [`../frontend`](../frontend): every payload the Next.js app renders is served here.

```bash
make api-dev                       # uvicorn --reload on :8000
uv run uvicorn ml_service.api.app:app --port 8011     # explicit port
make api-docker                    # docker build + run (port 8000)
docker compose -f compose.api.yml up --build
```

Interactive docs: `/docs` (Swagger) and `/openapi.json`.

### Configuration

| Env var | Default | Meaning |
|---|---|---|
| `XRAY_DATA_DIR` | `backend/data` | Root of the artefact folder |
| `XRAY_CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated allowed origins |
| `XRAY_API_KEY` | *(unset)* | When set, `POST` endpoints require `Authorization: Bearer <key>` (or `X-API-Key`) |
| `PORT` | `8000` | Port used by the container / `python -m ml_service.api` |

At start-up `api/store.py` loads, in order: `data/output/web/summary.json` +
`data/output/web/companies/<id>.json` (written by `run_export.py`); if those are
absent it falls back to `data/output/scored_panel.parquet` and rebuilds the
records with `export.company_records` (in that fallback `reasons` and
`explanation` are empty, because they need the SHAP-enriched frame). Alerts come
from `summary.alerts`, else from `monitor.build_alerts` computed on the fly. The
store sits behind a `RecordStore` Protocol, so tests inject a fake and touch no
disk.

### Endpoints

| Method | Path | Returns |
|---|---|---|
| `GET` | `/health` | `{status, n_companies, models_loaded, generated_at}` |
| `GET` | `/api/meta` | `{pillar_labels, feature_labels, evaluation, anticipation}` |
| `GET` | `/api/companies` | Paginated company summaries **without** `series` + totals |
| `GET` | `/api/companies/{company_id}` | `{company (incl. series), alerts, explanation, offer}` |
| `GET` | `/api/movers` | Top improvers / decliners over a window |
| `GET` | `/api/alerts` | Filtered alert list |
| `GET` | `/api/alerts/counts` | Alert counts by type / severity / month |
| `GET` | `/api/offers` | Working-capital offers for every company + portfolio totals |
| `GET` | `/api/offers/{company_id}` | `{offer, history}` — 12-month limit history |
| `POST` | `/api/score` | Multipart ZIP of the challenge CSVs → scored records + `submission_csv` |
| `POST` | `/api/score/path` | `{"raw_dir": "..."}` — same, for a folder on the server |
| `GET` | `/api/submission.csv` | Training-set submission CSV (`text/csv` download) |

Query parameters:

- `/api/companies?direction=&regime=&min_score=&max_score=&q=&sort=&limit=&offset=`
  — `sort` is `score`, `p_stress`, `trend_6m` or `company_id`, prefixed with `-`
  for descending (default `-score`); `limit` ≤ 500; `q` matches the company id.
- `/api/movers?window=6&limit=10` — `window` in months (≤ 24).
- `/api/alerts?type=&severity=&month=YYYY-MM&limit=`
- `/api/offers?status=preaprobada|en_vigilancia|cerrada&limit=`

Errors are JSON `{"detail": "..."}`: `404` unknown company, `400` bad upload or
folder, `401` missing API key, `503` artefacts unavailable.

### Sample responses (truncated)

```jsonc
// GET /health
{"status":"ok","n_companies":1286,"models_loaded":true,
 "generated_at":"2026-09-18T18:27:05+00:00"}

// GET /api/companies?limit=3
{"items":[{"company_id":"COMP_1136","group_id":"GROUP_0222","months_observed":22,
           "score":96.7406,"score_prev":96.6124,"score_6m_ago":96.3667,
           "trend_6m":0.0349,"direction":"stable","regime":"structural_improvement",
           "p_stress":0.0065,"pillars":{"liquidity":80.83, "...":0},"reasons":[]}],
 "total":1286,"limit":3,"offset":0,
 "totals":{"n_companies":1286,"avg_score":56.29,
           "by_direction":{"improving":518,"stable":462,"deteriorating":306},
           "by_regime":{"structural_improvement":637,"steady":239,
                        "structural_decline":402,"transient_dip":4,"transient_spike":4},
           "at_risk":138}}

// GET /api/offers/COMP_0001
{"offer":{"company_id":"COMP_0001","month":"2026-08","score":69.02,"p_stress":0.0276,
          "regime":"structural_improvement","avg_monthly_inflow_3m":69341.21,
          "k":0.92,"limit":63793.92,"spread_bps":283,"status":"preaprobada"},
 "history":[{"month":"2025-09","k":0.125,"limit":0.0,"spread_bps":416,
             "status":"en_vigilancia"}]}

// GET /api/alerts/counts
{"total":9566,
 "by_type":{"liquidity_squeeze":3283,"improvement":2199,"score_drop":1407,
            "structural_decline":1047,"stress_risk_high":857,"payment_stress":773},
 "by_severity":{"critical":5789,"info":2199,"warning":1578},
 "by_month":{"2026-08":525,"...":0}}
```

### Dynamic working-capital offer (source of truth)

`api/offers.py` owns the product formula; the web app must mirror it, never
reimplement it differently:

```
k = 0     if score < 35
    0.25  if 35 <= score < 50
    0.5   if 50 <= score < 65
    0.8   if 65 <= score < 80
    1.0   if score >= 80

k *= 0.5   if regime == "structural_decline"
k *= 1.15  if regime == "structural_improvement"   (capped at k = 1.0)

limit       = clamp(k * avg_monthly_inflow_3m, 0, 2_000_000)
spread_bps  = 250 + round(1200 * p_stress)
status      = "preaprobada"    if score >= 50 and p_stress < 0.35
              "en_vigilancia"  if 35 <= score < 50 or 0.35 <= p_stress < 0.6
              "cerrada"        otherwise
```

`avg_monthly_inflow_3m` is the mean of `series[-3:].raw.inflow`; the history
endpoint recomputes the same formula month by month with each month's trailing
3-month inflow, score, `p_stress` and regime.

### Scoring an unseen dataset over HTTP

```bash
zip -j hidden.zip /path/to/hidden_test/*.csv
curl -X POST http://localhost:8000/api/score \
     -H "Authorization: Bearer $XRAY_API_KEY" \
     -F file=@hidden.zip | jq '.n_companies, .n_rows'
```

The ZIP may contain the nine challenge CSVs or a subset, at minimum
`transactions.csv`, `balances.csv` and `companies.csv`, at the archive root or
inside a single folder. The response is
`{n_companies, n_rows, companies[], submission_csv}` where `companies[]` has the
same shape as `/api/companies/{id}.company` and `submission_csv` is the
leaderboard CSV as a string. Archives are extracted into a temp dir (path
traversal rejected, 200 MB cap) and deleted afterwards.

### Deployment

`Dockerfile` is a two-stage build on `python:3.12-slim` (`uv sync --frozen
--no-dev`, `libgomp1` for LightGBM) and bakes `data/models` plus
`data/output/{web,scored_panel.parquet,evaluation.json,anticipation.json}` into
the image, so the container serves the demo with no volumes. `.dockerignore`
keeps `data/raw` and the parquet cache out. `fly.toml` is a ready Fly.io config
(health check on `/health`, `PORT=8080`); `compose.api.yml` runs the same image
locally.

---

# PULSE: Payment, Underwriting, Liquidity & Solvency Estimate

A second, fully transparent 0-100 company health score built **from scratch** in
`src/ml_service/pulse/` with 11 variables and fixed percentage weights. It does
not reuse the X-Ray feature pipeline: it has its own loader, cleaning layer and
feature code, because the raw dataset is deliberately corrupted (currencies,
sentinel amounts, impossible dates, duplicates).

```bash
uv run python -m ml_service.pulse.cli build     # clean + panel -> data/pulse/{panel.parquet,cleaning_report.md}
uv run python -m ml_service.pulse.cli fit       # freeze normaliser + calibration -> data/pulse/models/
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
components; `pulse_raw` is the weighted mean of the known variables with the
weights renormalised, so an unknown variable neither helps nor hurts. `confidence`
is the share of the 100 points backed by data (a proxy-backed variable counts
only part of its weight, see below; `confidence_from_proxies` is the share that
comes from proxies and `var_<key>__source` says `primary`, `proxy` or null).
`pulse` is the percentile of
`pulse_raw` in the training population (frozen grid), so it spans 0-100 and a
PULSE of 80 reads "healthier than 80 % of the fitted portfolio". `contrib_<key>`
splits `pulse_raw` into the points each variable is responsible for. Everything
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

Monthly PULSE forecasts for +1..+6 months, each with a p10-p90 band and an
exact decomposition of the predicted change into the 11 variables.

```bash
uv run python -m ml_service.pulse.forecast.cli fit        # 6 horizon models -> data/pulse/models/forecast/
uv run python -m ml_service.pulse.forecast.cli evaluate   # OOF vs persistence/reversion -> forecast_evaluation.json
uv run python -m ml_service.pulse.forecast.cli predict [--raw-dir DIR] [--all-months]   # -> data/pulse/forecast.{parquet,csv}
uv run python -m ml_service.pulse.export_web              # -> data/pulse/web/ (+ mirror in ../frontend/src/data/pulse)
```

**Design.** One LightGBM model per horizon predicts the *change* of `pulse_raw`
(`objective=huber`), plus two quantile boosters (α = 0.1 / 0.9) for the band, so
persistence is the starting point and the model only learns deviations. Inputs
(162 columns, `forecast/features.py`): the 11 variables and their percentiles,
Δ1/Δ3/Δ6 and 6-month volatility of every level, the four pillars and PULSE itself,
cash-account flows (inflows, net 3m/6m, growth), the invoice calendar (AR/AP
already due within 1/3/6 months, open overdue amounts), stress narratives
(returned debits, overdrafts), intragroup inflow share, group mean PULSE and
observation length. The per-feature contributions returned by LightGBM
(`pred_contrib`) are folded into the 11 variables (`forecast/attribution.py`):
component-derived features go to their variable, pillar-level features are split
by weight inside the pillar, PULSE-level features across all variables by weight,
and everything else is reported as `contexto`; the bias is `base`. The parts sum
to `delta_raw` to 1e-14. Forecasts are expressed on the 0-100 PULSE scale through
the frozen calibration.

**Evaluation** (`data/pulse/forecast_evaluation.json`, GroupKFold(5) on
`group_id`, MAE in points of `pulse_raw`). "Reversion" is a one-parameter
mean-reversion baseline fitted out of fold; anything that does not beat it is
just percentiles drifting back to the middle.

| horizon | rows | persist | reversion | ML | vs persist | vs reversion | direction on moves > 15 | recall declines | recall improvements | p10-p90 coverage |
|---|---|---|---|---|---|---|---|---|---|---|
| +1 | 20,932 | 5.72 | 5.88 | **5.32** | +7.0 % | +9.7 % | 0.84 | 0.13 | 0.00 | 0.77 |
| +2 | 19,647 | 8.47 | 8.36 | **7.43** | +12.2 % | +11.1 % | 0.87 | 0.47 | 0.05 | 0.76 |
| +3 | 18,362 | 10.52 | 9.97 | **8.86** | +15.8 % | +11.2 % | 0.87 | 0.61 | 0.18 | 0.76 |
| +4 | 17,077 | 11.20 | 10.52 | **9.37** | +16.4 % | +11.0 % | 0.87 | 0.63 | 0.17 | 0.75 |
| +5 | 15,795 | 11.83 | 10.99 | **9.90** | +16.4 % | +10.0 % | 0.87 | 0.64 | 0.16 | 0.74 |
| +6 | 14,514 | 12.35 | 11.39 | **10.33** | +16.4 % | +9.4 % | 0.87 | 0.66 | 0.16 | 0.74 |

The models see declines far better than recoveries (recall 0.66 vs 0.16 at six
months): read the forecast as an early warning, not as a promise of improvement.
A preliminary experiment forecasting each pillar separately showed that *cobro*
and *pago* pillar forecasts do not beat the reversion baseline, which is why only
PULSE itself is modelled and the breakdown comes from attribution rather than
from per-variable models. Horizon models are independent, so a company's
trajectory across horizons is not forced to be monotone.

**API.** `GET /api/pulse/summary` and `GET /api/pulse/companies/{company_id}`
serve the files written by `export_web.py` (`routes_pulse.py`); the contract is
the JSON described in the frontend data layer (`frontend/src/lib/pulse`).
