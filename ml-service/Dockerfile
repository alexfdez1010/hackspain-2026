# syntax=docker/dockerfile:1
# X-Ray API: self-contained image (engine + precomputed artefacts).

FROM python:3.12-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:0.9.10 /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Dependency layer: cached while pyproject.toml / uv.lock do not change.
COPY pyproject.toml uv.lock README.md ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

# Project layer.
COPY src ./src
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev


FROM python:3.12-slim AS runtime

# libgomp1 is required by LightGBM.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    XRAY_DATA_DIR=/app/data

COPY --from=builder /app/.venv /app/.venv
COPY src ./src
# .dockerignore keeps only data/models and the precomputed web artefacts.
COPY data ./data

EXPOSE 8000

CMD ["sh", "-c", "uvicorn ml_service.api.app:app --host 0.0.0.0 --port ${PORT:-8000}"]
