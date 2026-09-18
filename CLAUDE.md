# HackSpain 2026 monorepo

Two independent applications live in this repository. Each one keeps its own
tooling, dependencies, tests and agent guidelines. Never mix them.

| Path           | Stack                                             | Guidelines                        |
| -------------- | ------------------------------------------------- | --------------------------------- |
| `web/`         | Next.js 16, React 19, TailwindCSS 4, HeroUI v3, Prisma | [`web/CLAUDE.md`](./web/CLAUDE.md)         |
| `ml-service/`  | Python 3.12, uv, pytest, Ruff                     | [`ml-service/AGENTS.md`](./ml-service/AGENTS.md) |

## Rules for every task

- **Work inside the app directory.** Run `bun`/`npm` commands from `web/` and
  `uv`/`make` commands from `ml-service/`. There is no root package manager.
- **Follow the app-specific guidelines** linked above; they are binding for
  code style, architecture, documentation and testing in that app.
- **Cross-app contracts** (HTTP payloads, shared schemas) must be documented
  in the README of the app that owns the endpoint and mirrored in the consumer.
- **Commits** may touch both apps, but each app must pass its own checks:
  `bun run lint-format` and `bun run test` in `web/`, `make pre-commit` in
  `ml-service/`.
- The `Makefile` at the root only delegates to the apps; keep it thin.

## Agent tooling shared at the root

- `.agents/skills/` and `skills-lock.json`: vendored agent skills (mostly for
  `web/`). Refresh with `bunx skills add ...` from the repository root.
- `.claude/skills/`: symlinks into `.agents/skills/`.
- `.vscode/settings.json`: editor defaults for both apps.
