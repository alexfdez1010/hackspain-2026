# ml-service

Python service of HackSpain 2026. It implements the domain logic and the
ML-based analysis consumed by the web app in [`../web`](../web).

Stack: Python 3.12, [uv](https://docs.astral.sh/uv/), pytest, Ruff. Guidelines
for AI coding assistants live in [`AGENTS.md`](./AGENTS.md).

## Setup

```bash
# Install uv (once)
curl -LsSf https://astral.sh/uv/install.sh | sh

cd ml-service
uv sync          # creates .venv and installs runtime + dev dependencies
cp .env.example .env
```

## Commands

```bash
make main              # Run the service entry point
make test              # Unit + integration tests
make test-unit         # Unit tests only (tests/unit)
make test-integration  # Integration tests only (tests/integration)
make format            # Ruff format
make lint              # Ruff check
make pre-commit        # Unit tests + format + lint
```

Direct equivalents: `uv run pytest`, `uv run ruff format`, `uv run ruff check`.

## Structure

```
ml-service/
├── src/ml_service/     # Package: domain logic and ML analysis
│   └── main.py         # Entry point
├── tests/
│   ├── unit/           # Fast, isolated tests (mocks at boundaries)
│   └── integration/    # Tests against real services
├── pyproject.toml      # Metadata, dependencies, tool config
├── uv.lock             # Locked dependencies (never edit by hand)
├── Makefile            # Task shortcuts
└── .python-version     # Interpreter version used by uv
```

## Dependencies

```bash
uv add <package>          # runtime dependency
uv add --dev <package>    # dev dependency
uv lock --upgrade         # refresh the lock file
```
