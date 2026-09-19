# 🫀 Embat PULSE · HackSpain 2026

PULSE (*Payment, Underwriting, Liquidity & Solvency Estimate*) is a transparent
0-100 financial-health score for SMEs built from their bank and ERP data, with a
six-month forecast, early-warning signals and priced product recommendations.
The monorepo holds two independent applications:

| Path | What it is | Docs |
| --- | --- | --- |
| [`backend/`](./backend) | 🐍 Python 3.12 pipeline (uv, Polars, LightGBM, scikit-learn). One command turns a raw dataset folder into every JSON the web app reads. **No server.** | [`backend/README.md`](./backend/README.md) |
| [`frontend/`](./frontend) | ⚛️ Next.js 16 web app (React 19, Tailwind 4, HeroUI v3). Single-company product; reads the JSON bundled under `frontend/src/data/pulse`. | [`frontend/README.md`](./frontend/README.md) |

Each app is self-contained (own dependencies, tests, lint) and the root
`Makefile` only delegates (`make help`).

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
new dataset.

## 🔁 How the two parts fit together

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

The JSON files are the **contract between the apps**; the backend owns it and
documents every field in
[`backend/docs/json-contract.md`](./backend/docs/json-contract.md).

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
