# HackSpain 2026

Monorepo with two applications:

| Path                          | What it is                                                   |
| ----------------------------- | ------------------------------------------------------------ |
| [`frontend/`](./frontend)               | Next.js 16 app (React 19, TailwindCSS 4, HeroUI v3)          |
| [`backend/`](./backend) | Python 3.12 service with the domain logic and ML analysis    |

Each app is self-contained: it has its own dependencies, tests, lint setup and
README. Run commands from inside the app directory or through the root
`Makefile` (`make help`).

## Quick start

```bash
# Web (requires bun)
cd frontend
bun install
cp .env.example .env
bun run dev

# ML service (requires uv)
cd backend
uv sync
cp .env.example .env
make main
```

## Full stack with Docker (PULSE demo)

```bash
make up          # builds and starts the API (:8000) and the web app (:3000)
make down
```

Then open <http://localhost:3000> and pick a company, or go straight to
<http://localhost:3000/empresa/COMP_0001> for an example company: monthly PULSE
history, the 11 variables with their contributions, and the +1..+6 month
forecast with bands. The API image ships the precomputed artefacts
(`backend/data/pulse/web`); the web container reads them through
`PULSE_API_URL=http://api:8000`. See `backend/README.md` (section PULSE) for how
the artefacts are produced.

## Layout

```
.
├── frontend/       # Next.js application       → frontend/README.md
├── backend/        # Python ML service + API   → backend/README.md
├── .agents/        # Vendored agent skills (skills-lock.json at root)
├── .claude/        # Claude Code config and skill symlinks
├── .vscode/        # Shared editor settings
├── CLAUDE.md       # Monorepo guidelines for AI assistants (AGENTS.md → CLAUDE.md)
└── Makefile        # Thin task runner delegating to each app
```

## Checks before committing

```bash
make pre-commit          # both apps
cd frontend && bun run pre-commit
cd backend && make pre-commit
```
