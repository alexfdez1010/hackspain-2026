"""Command line of the whole PULSE pipeline.

    uv run pulse                                   # train on data/raw/xray -> data/pulse/export
    uv run pulse --out ../frontend/src/data/pulse  # same, straight into the web app
    uv run pulse --raw-dir /path/to/dataset        # train on another dataset
    uv run pulse --raw-dir /path/to/hidden --frozen   # score it with the frozen models
    uv run pulse --export-only                     # rebuild the JSON from the last run
    uv run pulse --no-evaluate                     # skip the out-of-fold evaluations

Every step prints what it wrote and how long it took; the last line is the
output folder.
"""

from __future__ import annotations

import argparse
import sys
import time
from collections.abc import Callable
from pathlib import Path

from ml_service.pulse.run import steps
from ml_service.pulse.run.assemble import assemble
from ml_service.pulse.run.options import RunOptions, resolve_options


def _timed(label: str, fn: Callable[[], object]) -> object:
    start = time.perf_counter()
    print(f"▶ {label}", flush=True)
    result = fn()
    print(f"  done in {time.perf_counter() - start:,.1f} s", flush=True)
    return result


def run(opts: RunOptions) -> Path:
    """Execute the pipeline described by ``opts`` and return the output folder."""
    print(f"PULSE pipeline · mode={opts.mode}")
    print(f"  raw:  {opts.raw_dir}\n  work: {opts.work_dir}\n  out:  {opts.out_dir}")
    if opts.frozen and not opts.export_only:
        steps.prepare_frozen(opts)
    inputs, panel = _timed("clean + panel", lambda: steps.build(opts))
    if opts.export_only:
        scored = steps.load_scored(opts)
    else:
        scored = _timed("PULSE score", lambda: steps.score(opts, panel))
        _timed("forecast +1..+6", lambda: steps.forecast(opts, inputs, scored))
        _timed("signals", lambda: steps.detect_signals(opts))
        _timed("advisor", lambda: steps.recommend(opts))
    _timed("web JSON", lambda: steps.export(opts, inputs, scored))
    out = _timed("assemble", lambda: assemble(opts))
    print(f"✔ {out}")
    return out


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="pulse",
        description="Turn a raw dataset folder into every PULSE JSON the web app reads.",
    )
    parser.add_argument(
        "--raw-dir", type=Path, help="folder with the raw CSVs (default data/raw/xray)"
    )
    parser.add_argument(
        "--out", type=Path, help="output folder (default <work dir>/export)"
    )
    parser.add_argument(
        "--work-dir",
        type=Path,
        help="folder for intermediate artefacts (default data/pulse, or "
        "data/pulse/runs/<dataset> for a frozen run of another dataset)",
    )
    parser.add_argument(
        "--frozen",
        action="store_true",
        help="reuse the models in --models-dir instead of fitting new ones",
    )
    parser.add_argument(
        "--models-dir",
        type=Path,
        help="where the frozen models come from (default data/pulse/models)",
    )
    parser.add_argument(
        "--no-evaluate",
        action="store_true",
        help="skip the out-of-fold evaluations (faster; reports are not refreshed)",
    )
    parser.add_argument(
        "--export-only",
        action="store_true",
        help="rebuild the JSON export from the artefacts of the last run",
    )
    return parser


def main(argv: list[str] | None = None) -> None:
    args = build_parser().parse_args(argv)
    opts = resolve_options(
        raw_dir=args.raw_dir,
        work_dir=args.work_dir,
        out_dir=args.out,
        models_dir=args.models_dir,
        frozen=args.frozen,
        evaluate=not args.no_evaluate,
        export_only=args.export_only,
    )
    try:
        run(opts)
    except KeyboardInterrupt:
        print("interrupted", file=sys.stderr)
        sys.exit(130)
    except FileNotFoundError as exc:
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
