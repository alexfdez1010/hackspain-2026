"""Score an unseen dataset folder with the persisted engine."""

from __future__ import annotations

import zipfile
from pathlib import Path

from ml_service.api.schemas import ScoreResult

REQUIRED_TABLES: tuple[str, ...] = ("transactions.csv", "balances.csv", "companies.csv")
SUBMISSION_NAME = "submission.csv"


def _is_safe(name: str) -> bool:
    """Reject absolute paths and parent traversal inside an archive."""
    path = Path(name)
    return not path.is_absolute() and ".." not in path.parts


def extract_zip(payload: bytes, dest: Path) -> Path:
    """Extract a CSV bundle and return the folder holding the tables.

    Args:
        payload: Raw bytes of the uploaded ZIP archive.
        dest: Empty folder the archive is extracted into.

    Returns:
        The folder that actually contains the challenge CSVs.

    Raises:
        ValueError: If the archive is invalid, unsafe or incomplete.
    """
    archive_path = dest / "upload.zip"
    archive_path.write_bytes(payload)
    try:
        with zipfile.ZipFile(archive_path) as archive:
            names = archive.namelist()
            if not all(_is_safe(name) for name in names):
                raise ValueError("Archive contains unsafe paths")
            archive.extractall(dest / "raw")
    except zipfile.BadZipFile as exc:
        raise ValueError("Uploaded file is not a valid ZIP archive") from exc
    return find_raw_dir(dest / "raw")


def find_raw_dir(root: Path) -> Path:
    """Locate the folder holding the challenge CSVs under ``root``.

    Raises:
        ValueError: If no folder holds the minimum required tables.
    """
    candidates = [root, *(p for p in root.rglob("*") if p.is_dir())]
    for folder in candidates:
        if all((folder / name).exists() for name in REQUIRED_TABLES):
            return folder
    required = ", ".join(REQUIRED_TABLES)
    raise ValueError(f"Missing required tables ({required}) in the uploaded data")


def score_raw_dir(
    raw_dir: Path, models_dir: Path, cache_dir: Path | None = None
) -> ScoreResult:
    """Build the panel for ``raw_dir``, score it and return records plus CSV.

    Args:
        raw_dir: Folder holding the challenge CSVs.
        models_dir: Folder holding the persisted engine artefacts.
        cache_dir: Parquet cache folder; defaults to ``raw_dir/_cache``.

    Returns:
        The scored company records and the submission CSV as a string.

    Raises:
        ValueError: If the folder yields an empty panel.
        FileNotFoundError: If the persisted engine is missing.
    """
    from ml_service.xray.export import company_records, export_submission
    from ml_service.xray.features.panel import build_panel
    from ml_service.xray.io import Dataset
    from ml_service.xray.score.pipeline import ScoreEngine

    dataset = Dataset(raw_dir, cache_dir=cache_dir or raw_dir / "_cache")
    panel = build_panel(dataset)
    if panel.is_empty():
        raise ValueError("The uploaded dataset produced an empty feature panel")
    scored = ScoreEngine.load(models_dir).score(panel)
    csv_path = export_submission(
        scored, (cache_dir or raw_dir / "_cache") / SUBMISSION_NAME
    )
    return ScoreResult(
        n_companies=int(scored["company_id"].n_unique()),
        n_rows=int(scored.height),
        companies=company_records(scored),
        submission_csv=csv_path.read_text(),
    )
