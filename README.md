<div align="center">

# 🫀 Embat PULSE

**A 0-100 financial-health score a finance director can check by hand, and a
product around it that tells the story of one company at a time.**

HackSpain 2026 · Embat challenge

[![HackSpain 2026](https://img.shields.io/badge/HackSpain-2026-e63946)](https://github.com/alexfdez1010/hackspain-2026)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![HeroUI](https://img.shields.io/badge/HeroUI-v3-7c3aed)](https://heroui.com/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-7-000000?logo=vercel&logoColor=white)](https://ai-sdk.dev/)
[![Bun](https://img.shields.io/badge/Bun-runtime-000000?logo=bun&logoColor=white)](https://bun.sh/)

[![Python](https://img.shields.io/badge/Python-3.12-3776ab?logo=python&logoColor=white)](https://www.python.org/)
[![uv](https://img.shields.io/badge/uv-managed-de5fe9?logo=uv&logoColor=white)](https://docs.astral.sh/uv/)
[![Polars](https://img.shields.io/badge/Polars-dataframes-cd792c?logo=polars&logoColor=white)](https://pola.rs/)
[![LightGBM](https://img.shields.io/badge/LightGBM-forecast-2e7d32)](https://lightgbm.readthedocs.io/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-models-f7931e?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)

[![Vitest](https://img.shields.io/badge/Vitest-unit-6e9f18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-e2e-2ead33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![pytest](https://img.shields.io/badge/pytest-tests-0a9edc?logo=pytest&logoColor=white)](https://docs.pytest.org/)
[![Ruff](https://img.shields.io/badge/Ruff-lint-d7ff64?logo=ruff&logoColor=black)](https://docs.astral.sh/ruff/)
[![Docker](https://img.shields.io/badge/Docker-compose-2496ed?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

</div>

---

## 💡 The idea

**PULSE** (_Payment, Underwriting, Liquidity & Solvency Estimate_) is a
financial-health score for SMEs built only from what a treasury platform
already knows: bank movements, balances, debt lines and, when the company has
an ERP, its invoices. Around the score the product gives each company a
six-month forecast with its band of uncertainty, alerts when the score really
moves, the variables with the most points to win, and the financing products
that fit its situation, priced and explained.

Embat set the challenge: take a deliberately corrupted dataset of 1,286
companies and turn it into something a finance director would trust and use
every month. Our answer is **one number that fits on a ruler, seven tabs that
follow the questions a reader asks, and nothing between the two but a folder of
JSON files.**

## 👀 What a finance team sees

One company per screen, chosen from the header. Every tab answers one question,
in the order a reader asks them:

| Tab              | The question                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **PULSE**        | _How am I?_ The score of the last close on the band ruler, its change, and the trajectory with the +1..+6 m forecast.                   |
| **Diagnóstico**  | _Where is the score decided?_ A mosaic of the 11 variables by pillar, each cell sized by its weight and coloured by its band.           |
| **Acción**       | _What do I fix first?_ The three variables with the most points to gain, each with the plan that would collect them.                    |
| **Detalle**      | _Show me the numbers._ Any month opened in full, the forecast by horizon, month-by-month tables, a worked example.                      |
| **Alertas**      | _Did something really change?_ Open episodes with the probability that they last, and the history of closed ones.                       |
| **Financiación** | _What product fits, for how much, at what price?_ Eligible products with the rate broken into components, and the lever that lowers it. |
| **Método**       | _How is it computed?_ The score explained without finance, with drawings, one real month added by hand and a glossary.                  |

**Nexo**, the assistant, sits on every page. It answers about the open company
in context and draws the same charts the pages use. Without an API key it
replays deterministic demo answers, so the whole product works offline.

## 🎯 Decisions we made for that reader

Every trade-off was settled by asking what a treasury team would trust.

- **A score you can defend in a meeting.** Eleven variables in four pillars
  (liquidity, debt, collections, payments) with fixed weights that sum to 100.
  No learned black box and no calibration on top: an 80 means the known
  variables average 80. The Método page lets anyone redo the arithmetic.
- **Honest about missing data.** A `confidence` figure says how many of the
  100 points rest on real data. Companies without an ERP get bank proxies for
  the invoice variables, and the screen says so.
- **A band, not a line.** The forecast is +1 to +6 months with a p10-p90
  band, because a single line pretends a certainty nobody has.
- **Alerts that stay rare.** An episode opens only when PULSE moves 6 points or
  more from its three-month baseline with at least two pillars behind it, and
  it is named by what it turned out to be: _caída_ or _bache_, _mejora_ or
  _repunte_.
- **Prices you can argue with.** Product eligibility and sizing are rules, so
  they can be audited. Only the risk premium comes from a model, and every
  offer shows its rate component by component.
- **One company per screen.** The reader is looking at their own company.
  Portfolio views, rankings and dashboards were removed on purpose.
- **Everything explained where it is shown.** Units, bases and horizons sit
  next to the figure, info tips replace titles, and every number links to the
  page that explains it. Anonymous identifiers are shown under memorable,
  deterministic names so a demo reads like a real portfolio.
- **Traceable, always.** Every figure on screen can be followed back to the
  data that produced it, from a score to the invoice or movement behind it.

## 🏗️ How it works

Two independent apps and a folder of JSON files between them. No HTTP API, no
database, no authentication: the backend writes the folder, the web app reads it.

```
  8 raw CSV tables            uv run pulse             JSON export             Next.js app
  (bank + ERP)        ───►   clean · score ·   ───►   summary, one file  ───►  one company
  1,286 companies             forecast · signals       per company,             per screen,
  2.4 M transactions          · advisor                catalogue, reports        Nexo on top
```

| App                       | What it is                                                                                             | Read more                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| [`backend/`](./backend)   | 🐍 Python pipeline. One command, about two minutes, byte-identical output on the same data. No server. | [`backend/README.md`](./backend/README.md)   |
| [`frontend/`](./frontend) | ⚛️ Next.js app. Server Components read the bundled JSON at request time; charts are our own SVG.       | [`frontend/README.md`](./frontend/README.md) |

The JSON files are the **contract between the apps**. The backend owns and
documents it in [`backend/docs/json-contract.md`](./backend/docs/json-contract.md).

## ✅ What has been built

- [x] Cleaning of the corrupted dataset with measured, documented rules
      ([`data-cleaning.md`](./backend/docs/data-cleaning.md)).
- [x] PULSE score: 11 variables, 4 pillars, confidence, bank proxies without ERP.
- [x] Forecast +1..+6 months with a conformal band; alternatives tried and
      rejected with numbers ([`model-selection.md`](./backend/docs/model-selection.md)).
- [x] Signals: episode detection and a model that says whether it will last.
- [x] Advisor: eligible financing products, sizing, priced and explained.
- [x] Frozen mode to score a hidden test set with the trained models, untouched.
- [x] Web app with the seven tabs, variable pages, plans per variable, mobile
      layouts and streaming skeletons on every route.
- [x] Nexo, an agent with read-only tools over the company and interactive
      charts, with an offline demo mode.
- [x] Tests at every layer: unit and integration in both apps, Playwright
      end-to-end on the built app, Ruff and ESLint/Prettier as pre-commit.

## 🚀 Using the repository

### Requirements

| Tool                             | For        |
| -------------------------------- | ---------- |
| [Bun](https://bun.sh/)           | `frontend` |
| [uv](https://docs.astral.sh/uv/) | `backend`  |
| Docker (optional)                | demo image |

### Run the web app

The repository ships a generated export under `frontend/src/data/pulse`, so the
web app runs with nothing else installed.

```bash
cd frontend
bun install
cp .env.example .env
bun run dev            # http://localhost:3000
```

Add `AI_GATEWAY_API_KEY` to `frontend/.env` only if you want Nexo to talk to a
real model. Without it, the assistant replays its demo.

### Regenerate the data

Only needed for a new dataset. Put the eight raw CSVs in
`backend/data/raw/xray/` and run:

```bash
cd backend
uv sync
uv run pulse --out ../frontend/src/data/pulse     # ≈ 2 min, or `make pulse-web` from the root
```

To score a hidden test set with the models already trained:

```bash
uv run pulse --frozen --raw-dir /path/to/hidden_test
```

### Demo with Docker

```bash
make up          # builds the web app with the bundled JSON on http://localhost:3000
make down
```

### Everyday commands

The root `Makefile` only delegates to the apps. `make help` lists everything.

| Command           | What it does                                    |
| ----------------- | ----------------------------------------------- |
| `make web-dev`    | Next.js dev server                              |
| `make web-test`   | Frontend unit, integration and end-to-end tests |
| `make pulse-web`  | Full pipeline written into the frontend         |
| `make ml-test`    | Backend tests                                   |
| `make pre-commit` | Lint, format and tests of both apps             |

## 📁 Layout

```
.
├── backend/        # Python pipeline + docs           → backend/README.md
├── frontend/       # Next.js application              → frontend/README.md
├── .agents/        # Vendored agent skills (skills-lock.json at root)
├── .claude/        # Claude Code config and skill symlinks
├── compose.yml     # Web app container
├── CLAUDE.md       # Monorepo guidelines for AI assistants
└── Makefile        # Thin task runner delegating to each app
```

## 📚 Where to read more

| Document                                                               | What it covers                                            |
| ---------------------------------------------------------------------- | --------------------------------------------------------- |
| [`backend/README.md`](./backend/README.md)                             | The pipeline, its options and what each step produces     |
| [`backend/docs/data-cleaning.md`](./backend/docs/data-cleaning.md)     | Every cleaning rule, with how much it touched             |
| [`backend/docs/model-selection.md`](./backend/docs/model-selection.md) | Score, forecast, signal and pricing choices, with numbers |
| [`backend/docs/json-contract.md`](./backend/docs/json-contract.md)     | Every field the frontend reads                            |
| [`frontend/README.md`](./frontend/README.md)                           | Routes, Nexo, tests and how the app is built              |
| [`frontend/design.md`](./frontend/design.md)                           | The visual language and the rules behind every screen     |
