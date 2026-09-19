"""Runtime settings for the PULSE API, parsed from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from ml_service.pulse.config import DATA_DIR

DEFAULT_PORT = 8000
DEFAULT_CORS: tuple[str, ...] = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
)


def _split_origins(raw: str | None) -> tuple[str, ...]:
    """Parse a comma-separated origin list, falling back to local defaults."""
    if not raw:
        return DEFAULT_CORS
    origins = tuple(item.strip() for item in raw.split(",") if item.strip())
    return origins or DEFAULT_CORS


def _int_env(name: str, default: int) -> int:
    """Read an integer environment variable, ignoring malformed values."""
    raw = os.getenv(name)
    if raw is None or not raw.strip().isdigit():
        return default
    return int(raw)


@dataclass(frozen=True)
class Settings:
    """Immutable API configuration.

    Attributes:
        data_dir: Root of the data folder (``PULSE_DATA_DIR``); the API serves
            ``<data_dir>/pulse/web`` and ``<data_dir>/pulse/recommendations``.
        cors_origins: Allowed browser origins (``PULSE_CORS_ORIGINS``).
        port: Port used by the ``__main__`` runner (``PORT``).
    """

    data_dir: Path
    cors_origins: tuple[str, ...]
    port: int = DEFAULT_PORT

    @property
    def pulse_dir(self) -> Path:
        """Folder holding every PULSE artefact (``data/pulse``)."""
        return self.data_dir / "pulse"

    @property
    def web_dir(self) -> Path:
        """Folder written by ``ml_service.pulse.export_web``."""
        return self.pulse_dir / "web"

    @property
    def recommendations_dir(self) -> Path:
        """Folder written by ``ml_service.pulse.recommend.cli build``."""
        return self.pulse_dir / "recommendations"


def build_settings() -> Settings:
    """Build settings from the current process environment."""
    return Settings(
        data_dir=DATA_DIR,
        cors_origins=_split_origins(os.getenv("PULSE_CORS_ORIGINS")),
        port=_int_env("PORT", DEFAULT_PORT),
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process-wide cached settings."""
    return build_settings()
