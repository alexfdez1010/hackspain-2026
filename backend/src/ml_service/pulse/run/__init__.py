"""One command that turns a raw dataset folder into every PULSE JSON the web app reads.

``uv run pulse`` (or ``python -m ml_service.pulse.run``) chains cleaning, the
PULSE score, the six-month forecast, the signals, the Advisor and the JSON
exports, then assembles the output folder. See :mod:`ml_service.pulse.run.cli`.
"""

from ml_service.pulse.run.options import RunOptions, resolve_options

__all__ = ["RunOptions", "resolve_options"]
