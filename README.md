# HackSpain 2026

Monorepo with two applications:

| Path                          | What it is                                                   |
| ----------------------------- | ------------------------------------------------------------ |
| [`web/`](./web)               | Next.js 16 app (React 19, TailwindCSS 4, HeroUI v3, Prisma)  |
| [`ml-service/`](./ml-service) | Python 3.12 service with the domain logic and ML analysis    |

Each app is self-contained: it has its own dependencies, tests, lint setup and
README. Run commands from inside the app directory or through the root
`Makefile` (`make help`).

## Quick start

```bash
# Web (requires bun and docker)
cd web
bun install
cp .env.example .env
bun run dev

# ML service (requires uv)
cd ml-service
uv sync
cp .env.example .env
make main
```

## Layout

```
.
├── web/            # Next.js application       → web/README.md
├── ml-service/     # Python ML service         → ml-service/README.md
├── .agents/        # Vendored agent skills (skills-lock.json at root)
├── .claude/        # Claude Code config and skill symlinks
├── .vscode/        # Shared editor settings
├── CLAUDE.md       # Monorepo guidelines for AI assistants (AGENTS.md → CLAUDE.md)
└── Makefile        # Thin task runner delegating to each app
```

## Checks before committing

```bash
make pre-commit          # both apps
cd web && bun run pre-commit
cd ml-service && make pre-commit
```
