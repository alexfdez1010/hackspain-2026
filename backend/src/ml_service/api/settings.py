"""Runtime settings for the X-Ray API, parsed from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from ml_service.xray.config import ML_ROOT

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
        data_dir: Root of the X-Ray data folder (``XRAY_DATA_DIR``).
        cors_origins: Allowed browser origins (``XRAY_CORS_ORIGINS``).
        api_key: Optional bearer token required by POST endpoints
            (``XRAY_API_KEY``); ``None`` disables the check.
        port: Port used by the ``__main__`` runner (``PORT``).
    """

    data_dir: Path
    cors_origins: tuple[str, ...]
    api_key: str | None
    port: int

    @property
    def output_dir(self) -> Path:
        """Folder holding engine outputs."""
        return self.data_dir / "output"

    @property
    def web_dir(self) -> Path:
        """Folder holding the precomputed payloads for the web app."""
        return self.output_dir / "web"

    @property
    def models_dir(self) -> Path:
        """Folder holding the persisted scoring artefacts."""
        return self.data_dir / "models"

    @property
    def features_dir(self) -> Path:
        """Folder holding the cached feature panel."""
        return self.data_dir / "features"


def build_settings() -> Settings:
    """Build settings from the current process environment."""
    raw_dir = os.getenv("XRAY_DATA_DIR")
    data_dir = Path(raw_dir) if raw_dir else ML_ROOT / "data"
    api_key = os.getenv("XRAY_API_KEY") or None
    return Settings(
        data_dir=data_dir,
        cors_origins=_split_origins(os.getenv("XRAY_CORS_ORIGINS")),
        api_key=api_key,
        port=_int_env("PORT", DEFAULT_PORT),
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process-wide cached settings."""
    return build_settings()
