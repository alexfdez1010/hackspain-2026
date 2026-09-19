main:
	@echo "Running main..."
	uv run src/ml_service/main.py

test: test-unit test-integration
	@echo "All tests completed successfully"

pre-commit: test-unit format lint

test-unit:
	@echo "Running unit tests..."
	uv run pytest -s tests/unit

test-integration:
	@echo "Running integration tests..."
	uv run pytest -s tests/integration

format:
	@echo "Formatting code..."
	uv run ruff format

lint:
	@echo "Running linter..."
	uv run ruff check

# --- X-Ray engine ---------------------------------------------------------
RAW ?= data/raw/xray
OUT_JSON ?= data/output/xray_export.json
OUT_CSV ?= data/output/submission.csv

xray-panel:
	@echo "Building X-Ray panel from $(RAW)..."
	uv run python -m ml_service.xray.cli build-panel --raw-dir $(RAW)

xray-train:
	@echo "Training X-Ray engine..."
	uv run python -m ml_service.xray.cli train

xray-score:
	@echo "Scoring $(RAW)..."
	uv run python -m ml_service.xray.cli score --raw-dir $(RAW) --out-json $(OUT_JSON) --out-csv $(OUT_CSV)

xray-evaluate:
	@echo "Evaluating X-Ray engine..."
	uv run python -m ml_service.xray.cli evaluate

xray-all: xray-panel xray-train xray-evaluate
	@echo "X-Ray pipeline finished"

# --- API ------------------------------------------------------------------
API_PORT ?= 8000
API_IMAGE ?= hackspain-xray-api:latest

api-dev:
	@echo "Serving the X-Ray API on http://127.0.0.1:$(API_PORT) ..."
	uv run uvicorn ml_service.api.app:app --reload --port $(API_PORT)

api-docker:
	@echo "Building and running $(API_IMAGE)..."
	docker build -t $(API_IMAGE) .
	docker run --rm -p $(API_PORT):8000 -e PORT=8000 $(API_IMAGE)

pulse-build:
	uv run python -m ml_service.pulse.cli build

pulse-fit:
	uv run python -m ml_service.pulse.cli fit

pulse-evaluate:
	uv run python -m ml_service.pulse.cli evaluate

pulse-score:
	uv run python -m ml_service.pulse.cli score --raw-dir $(RAW) $(if $(OUT),--out $(OUT),)

pulse-all: pulse-build pulse-fit pulse-evaluate

pulse-forecast-fit:
	uv run python -m ml_service.pulse.forecast.cli fit

pulse-forecast-evaluate:
	uv run python -m ml_service.pulse.forecast.cli evaluate

pulse-forecast:
	uv run python -m ml_service.pulse.forecast.cli predict $(if $(RAW),--raw-dir $(RAW),) $(if $(OUT),--out $(OUT),)

# --- PULSE Advisor (product recommendations) ------------------------------
pulse-reco-fit:
	uv run python -m ml_service.pulse.recommend.cli fit

pulse-reco-build:
	uv run python -m ml_service.pulse.recommend.cli build $(if $(RAW),--raw-dir $(RAW),)

pulse-reco-show:
	uv run python -m ml_service.pulse.recommend.cli show $(COMPANY)

pulse-reco-all: pulse-reco-fit pulse-reco-build
