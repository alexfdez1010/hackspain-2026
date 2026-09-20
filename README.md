# 🫀 Embat PULSE · HackSpain 2026

**PULSE** (_Payment, Underwriting, Liquidity & Solvency Estimate_) is a
transparent 0-100 financial-health score for SMEs, built only from the data a
treasury platform already has: bank movements, balances, debt lines and, when
the company has an ERP, its invoices. Around the score, the product gives each
company a six-month forecast with its band of uncertainty, alerts when the score
really moves, the variables where it has the most points to win, and the
financial products that fit its situation, priced. Every figure on screen can
be traced back to the data that produced it.

The challenge, set by Embat, was to turn a deliberately corrupted dataset of
1,286 companies into something a finance director would trust and use. The
answer is one score that fits on a ruler, a product with seven tabs, and no
machinery between the two beyond a folder of JSON files.

## 🧭 What the product does

One company per screen. Each company has seven tabs, in the
order a reader asks questions:

| Tab                         | Question it answers                                                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PULSE** (`/company/[id]`) | How am I? The score of the last close on the band ruler, its change, how much of it rests on data, cash days and customer health, the trajectory with the +1..+6 m forecast. |
| **Diagnóstico**             | Where is the score decided? A mosaic of the 11 variables by pillar, each cell sized by its weight and washed with its band colour.                                           |
| **Acción**                  | What do I fix first? The three variables with the most PULSE points to gain, each with the plan that would collect them.                                                     |
| **Detalle**                 | Show me the numbers. Any close opened in full, the forecast by horizon, month-by-month tables, a worked example.                                                             |
| **Alertas**                 | Did something really change? Open episodes with the probability that they last, and the history of closed ones.                                                              |
| **Financiación**            | What product fits, for how much and at what price? Eligible products, their rate broken into components, and the lever that would lower it.                                  |
| **Método**                  | How is it computed? The four steps of the month's score in plain words, with a real month added by hand.                                                                     |

Nexo, the assistant, sits on every page and answers about the company in
context, drawing the same charts the pages use. Without an API key it replays
deterministic demo answers, so the whole product runs offline.

## 🏗️ Architecture

Two independent applications and a contract of JSON files between them. There
is no HTTP API, no database and no authentication: the backend writes a folder
and the frontend reads it.

| Path                      | What it is                                                                                                                                        | Docs                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [`backend/`](./backend)   | 🐍 Python 3.12 pipeline (uv, Polars, LightGBM, scikit-learn). One command turns the raw dataset into every JSON the web app reads. **No server.** | [`backend/README.md`](./backend/README.md)   |
| [`frontend/`](./frontend) | ⚛️ Next.js 16 web app (React 19, Tailwind 4, HeroUI v3). Server Components that read the JSON bundled under `frontend/src/data/pulse`.            | [`frontend/README.md`](./frontend/README.md) |

```
backend/data/raw/xray/*.csv                       the 8 raw tables (not versioned)
        │  uv run pulse
        ▼
backend/data/pulse/                               intermediate artefacts, models, reports
        │
        ▼
<output folder>/                                  default backend/data/pulse/export
├── summary.json                                  score definition + latest PULSE per company
├── companies/<id>.json                           history, 6-month forecast, signals
├── details/<id>.json                             what is behind each variable
├── recommendations/{catalogue.json, companies/}  Advisor
├── reports/                                      cleaning + evaluation reports
└── manifest.json
        │  --out ../frontend/src/data/pulse   (or copy the folder)
        ▼
frontend/src/data/pulse/                          read by the Next.js server at request time
```

The JSON files are the **contract between the apps**. The backend owns it and
documents every field in
[`backend/docs/json-contract.md`](./backend/docs/json-contract.md); the
frontend README mirrors what it consumes.

### The backend, in five steps

`uv run pulse` runs the whole thing in about two minutes and is reproducible:
two runs on the same data write byte-identical JSON.

1. **Clean and build the panel.** The raw tables carry corrupt exchange rates,
   sentinel amounts, impossible dates and duplicates. A fixed set of rules,
   each one measured and documented in
   [`data-cleaning.md`](./backend/docs/data-cleaning.md), turns 2.4 M
   transactions and 760 k invoices into 14,514 company-months.
2. **Score.** Eleven variables in four pillars (liquidity, debt, collections,
   payments) with fixed percentage weights that sum to 100. Each variable is
   placed on its empirical percentile, PULSE is the weighted mean of the known
   ones, and `confidence` says how many of the 100 points are backed by data.
   Companies without an ERP get bank proxies for the invoice variables, and the
   product says so. No calibration on top: 80 means the known variables average 80.
3. **Forecast +1..+6 months.** One LightGBM predicts the _change_ of the score,
   with the horizon as an ordinary input; persistence is the starting point and
   the model only learns deviations. The p10-p90 band is conformal, from
   out-of-fold residuals grouped by company.
4. **Signals.** An episode opens when PULSE moves 6 points or more from its
   three-month baseline with at least two pillars behind it. A small logistic
   model estimates whether it will last, which names it: _caída_ or _bache_,
   _mejora_ or _repunte_.
5. **Advisor.** Rule-based where the decision must be auditable (eligibility,
   sizing) and a small model where a probability is needed (the risk premium).
   Every offer explains its price component by component.

Model choices and the alternatives that were tried and rejected, with numbers,
are in [`model-selection.md`](./backend/docs/model-selection.md).

### The frontend, in three ideas

- **Pages are Server Components that read local files.** No fetch, no loading
  spinners on data, no client state to keep in sync. The only client code is
  the assistant, the pickers and the interactions of the charts.
- **Charts are our own SVG.** They receive numbers already computed and draw
  them with the same score scale used in headers and tables, so a colour means
  the same thing everywhere.
- **Everything is explained where it is shown.** Units, bases and horizons go
  next to the figure; info tips replace titles; each route is linked from the
  number that motivates it. The design rules live in
  [`frontend/design.md`](./frontend/design.md).

## 🎯 How we prioritised

Simplicity and the reader's experience decided every trade-off:

- **A score you can defend.** Fixed weights and percentiles instead of a
  learned black box. A finance director can check the 100 points by hand on
  the Método page, and the backend asserts the weights sum to 100 at import.
- **One command, one folder.** The pipeline has no server, no queue and no
  environment to keep alive; the web app bundles the output. A hidden test set
  is scored with `--frozen` and never touches the training run.
- **Honest numbers.** Confidence separates what the data says from what a
  proxy suggests; the forecast shows a band, not a line; a signal is only
  raised when several pillars move together, so alerts stay rare and
  meaningful.
- **One company per screen.** The reader is a treasury team looking at its own
  company. Portfolio views, dashboards and rankings were removed on purpose.
- **Text that earns its place.** Every word must add information: no slogans,
  no decorative icons, no cards that only wrap a number. Panels separate with a
  hairline, never a shadow.
- **Works without keys and without network.** Demo answers for Nexo, anonymous
  companies shown under deterministic stand-in names, a generated export
  checked into the repo.
- **Fast by construction.** Streaming skeletons on every product route, local
  data at request time, mobile layouts checked in the end-to-end tests.
- **Tested at every layer.** Unit and integration tests in both apps, Playwright
  end-to-end tests on the built app, Ruff and ESLint/Prettier as pre-commit.

## 🚀 Quick start

```bash
# 1. Backend: generate the data (needs uv and the raw CSVs in backend/data/raw/xray)
cd backend
uv sync
uv run pulse --out ../frontend/src/data/pulse     # ≈ 2 min; or `make pulse-web`

# 2. Frontend: run the web app (needs bun)
cd ../frontend
bun install
cp .env.example .env
bun run dev                                       # http://localhost:3000/company/COMP_0001
```

The repository already ships a generated export under
`frontend/src/data/pulse`, so step 1 is only needed to regenerate it from a
new dataset. Add `AI_GATEWAY_API_KEY` to `frontend/.env` only to run Nexo
against a real model.

## 🐳 Docker

```bash
make up          # builds and starts the web app on :3000 with the bundled JSON
make down
```

## 📁 Layout

```
.
├── backend/        # Python pipeline + docs        → backend/README.md
├── frontend/       # Next.js application           → frontend/README.md
├── .agents/        # Vendored agent skills (skills-lock.json at root)
├── .claude/        # Claude Code config and skill symlinks
├── .vscode/        # Shared editor settings
├── compose.yml     # Web app container
├── CLAUDE.md       # Monorepo guidelines for AI assistants (AGENTS.md → CLAUDE.md)
└── Makefile        # Thin task runner delegating to each app
```

## ✅ Checks before committing

```bash
make pre-commit          # both apps
cd frontend && bun run pre-commit
cd backend && make pre-commit
```
