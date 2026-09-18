"""Run the API with uvicorn: ``uv run python -m ml_service.api``."""

from __future__ import annotations

import uvicorn

from ml_service.api.settings import get_settings

HOST = "0.0.0.0"


def main() -> None:
    """Serve the app on the configured ``PORT``."""
    settings = get_settings()
    uvicorn.run("ml_service.api.app:app", host=HOST, port=settings.port)


if __name__ == "__main__":
    main()
