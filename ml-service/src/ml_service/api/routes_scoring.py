"""Ad-hoc scoring endpoints and the submission CSV download."""

from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import PlainTextResponse

from ml_service.api import scoring
from ml_service.api.deps import ApiKeyDep, SettingsDep, StoreDep
from ml_service.api.schemas import ScoreRequest, ScoreResult

router = APIRouter(prefix="/api", tags=["scoring"])

MAX_UPLOAD_BYTES = 200 * 1024 * 1024
CSV_FILENAME = "submission.csv"


def _run(
    raw_dir: Path, settings: SettingsDep, cache_dir: Path | None = None
) -> ScoreResult:
    """Score ``raw_dir``, translating engine failures into HTTP errors."""
    if not settings.models_dir.exists():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Scoring artefacts are not available in this deployment",
        )
    try:
        return scoring.score_raw_dir(raw_dir, settings.models_dir, cache_dir)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Scoring artefacts are incomplete: {exc}",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@router.post("/score", response_model=ScoreResult, dependencies=[ApiKeyDep])
async def score_upload(
    settings: SettingsDep,
    file: Annotated[UploadFile, File(description="ZIP with the challenge CSVs")],
) -> ScoreResult:
    """Score a ZIP upload holding the challenge CSVs (at least 3 tables)."""
    payload = await file.read()
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Empty upload"
        )
    if len(payload) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Upload exceeds the 200 MB limit",
        )
    with tempfile.TemporaryDirectory(prefix="xray-score-") as tmp:
        root = Path(tmp)
        try:
            raw_dir = scoring.extract_zip(payload, root)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
            ) from exc
        return _run(raw_dir, settings, cache_dir=root / "cache")


@router.post("/score/path", response_model=ScoreResult, dependencies=[ApiKeyDep])
def score_path(settings: SettingsDep, body: ScoreRequest) -> ScoreResult:
    """Score a folder already present on the server (local development)."""
    raw_dir = Path(body.raw_dir).expanduser()
    if not raw_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{body.raw_dir!r} is not a directory",
        )
    try:
        resolved = scoring.find_raw_dir(raw_dir)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    with tempfile.TemporaryDirectory(prefix="xray-score-") as tmp:
        return _run(resolved, settings, cache_dir=Path(tmp))


@router.get("/submission.csv", response_class=PlainTextResponse)
def submission_csv(store: StoreDep) -> PlainTextResponse:
    """Download the training-set submission CSV."""
    content = store.submission_csv()
    if content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No submission CSV available in this deployment",
        )
    return PlainTextResponse(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{CSV_FILENAME}"'},
    )
