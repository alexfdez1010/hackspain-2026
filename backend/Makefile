# Embat PULSE backend: a command-line pipeline (no server). `make help` lists everything.

.PHONY: help pulse pulse-web pulse-frozen pulse-export test test-unit test-integration format lint pre-commit \
	pulse-build pulse-fit pulse-evaluate pulse-score pulse-forecast-fit pulse-forecast-evaluate pulse-forecast \
	pulse-export-web pulse-export-details pulse-signals-fit pulse-signals-build pulse-signals-show \
	pulse-reco-fit pulse-reco-build pulse-reco-show

RAW ?= data/raw/xray
WEB_DATA = ../frontend/src/data/pulse

help:
	@echo "pulse            Run the whole pipeline on RAW (default data/raw/xray) -> OUT (default data/pulse/export)"
	@echo "pulse-web        Same, written straight into the web app ($(WEB_DATA))"
	@echo "pulse-frozen     Score another dataset with the frozen models: make pulse-frozen RAW=/path/to/hidden"
	@echo "pulse-export     Rebuild the JSON export from the last run without refitting"
	@echo "test             Unit + integration tests   |  pre-commit: unit tests + format + lint"
	@echo "pulse-*          Individual steps (build, fit, evaluate, forecast, signals, reco, export); see README"

# --- The one command ---------------------------------------------------------
pulse:
	uv run pulse --raw-dir $(RAW) $(if $(OUT),--out $(OUT),) $(if $(WORK),--work-dir $(WORK),) $(if $(NO_EVAL),--no-evaluate,)

pulse-web:
	$(MAKE) pulse OUT=$(WEB_DATA)

pulse-frozen:
	uv run pulse --frozen --raw-dir $(RAW) $(if $(OUT),--out $(OUT),) $(if $(WORK),--work-dir $(WORK),)

pulse-export:
	uv run pulse --export-only --raw-dir $(RAW) $(if $(OUT),--out $(OUT),) $(if $(WORK),--work-dir $(WORK),)

# --- Quality -------------------------------------------------------------------
test: test-unit test-integration
	@echo "All tests completed successfully"

pre-commit: test-unit format lint

test-unit:
	uv run pytest -s tests/unit

test-integration:
	uv run pytest -s tests/integration

format:
	uv run ruff format

lint:
	uv run ruff check

# --- Individual steps (what `pulse` chains, for debugging one piece) ------------
pulse-build:
	uv run python -m ml_service.pulse.cli build --raw-dir $(RAW)

pulse-fit:
	uv run python -m ml_service.pulse.cli fit

pulse-evaluate:
	uv run python -m ml_service.pulse.cli evaluate

pulse-score:
	uv run python -m ml_service.pulse.cli score --raw-dir $(RAW) $(if $(OUT),--out $(OUT),)

pulse-forecast-fit:
	uv run python -m ml_service.pulse.forecast.cli fit

pulse-forecast-evaluate:
	uv run python -m ml_service.pulse.forecast.cli evaluate

pulse-forecast:
	uv run python -m ml_service.pulse.forecast.cli predict

pulse-signals-fit:
	uv run python -m ml_service.pulse.signals.cli fit

pulse-signals-build:
	uv run python -m ml_service.pulse.signals.cli build

pulse-signals-show:
	uv run python -m ml_service.pulse.signals.cli show $(COMPANY)

pulse-reco-fit:
	uv run python -m ml_service.pulse.recommend.cli fit

pulse-reco-build:
	uv run python -m ml_service.pulse.recommend.cli build --raw-dir $(RAW)

pulse-reco-show:
	uv run python -m ml_service.pulse.recommend.cli show $(COMPANY)

pulse-export-web:
	uv run python -m ml_service.pulse.export_web

pulse-export-details:
	uv run python -m ml_service.pulse.export_details
