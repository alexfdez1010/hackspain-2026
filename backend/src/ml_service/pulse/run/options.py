"""Where a run reads from and writes to, with defaults that need no setup."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from ml_service.pulse.config import RAW_DIR, WORK_DIR

RUNS_DIR = "runs"
"""Sub-folder of the work dir where frozen runs of other datasets live."""
EXPORT_DIR = "export"
"""Sub-folder of a work dir that receives the assembled JSON output."""
MODELS_DIR = "models"
"""Sub-folder of a work dir holding every frozen model."""


@dataclass(frozen=True)
class RunOptions:
    """Resolved paths and flags of one pipeline run.

    Attributes:
        raw_dir: Folder with the eight raw CSV files.
        work_dir: Folder for every intermediate artefact (parquet, models, reports).
        out_dir: Folder that receives the assembled JSON export.
        models_dir: Folder the frozen models are copied from (frozen runs only).
        frozen: Reuse the models in ``models_dir`` instead of fitting new ones.
        evaluate: Run the evaluations (out-of-fold, slow) after each fit.
        export_only: Skip every fit and prediction; rebuild the JSON export from
            the artefacts already in ``work_dir``.
    """

    raw_dir: Path
    work_dir: Path
    out_dir: Path
    models_dir: Path
    frozen: bool = False
    evaluate: bool = True
    export_only: bool = False

    @property
    def mode(self) -> str:
        """Human-readable mode: ``train``, ``frozen`` or ``export-only``."""
        if self.export_only:
            return "export-only"
        return "frozen" if self.frozen else "train"


def resolve_options(
    raw_dir: Path | None = None,
    work_dir: Path | None = None,
    out_dir: Path | None = None,
    models_dir: Path | None = None,
    frozen: bool = False,
    evaluate: bool = True,
    export_only: bool = False,
) -> RunOptions:
    """Fill in the defaults so ``uv run pulse`` works with no arguments.

    A training run works in ``data/pulse``. A frozen run of another dataset gets
    its own work dir, ``data/pulse/runs/<dataset name>``, so it never overwrites
    the training artefacts. The output folder defaults to ``<work dir>/export``.
    """
    raw = (raw_dir or RAW_DIR).expanduser().resolve()
    if work_dir is not None:
        work = work_dir.expanduser().resolve()
    elif frozen and raw != RAW_DIR.resolve():
        work = WORK_DIR / RUNS_DIR / raw.name
    else:
        work = WORK_DIR
    return RunOptions(
        raw_dir=raw,
        work_dir=work,
        out_dir=(out_dir or work / EXPORT_DIR).expanduser().resolve(),
        models_dir=(models_dir or WORK_DIR / MODELS_DIR).expanduser().resolve(),
        frozen=frozen,
        evaluate=evaluate,
        export_only=export_only,
    )
