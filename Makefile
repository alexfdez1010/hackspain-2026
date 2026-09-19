# Root task runner. Delegates to each app; keep it thin.

.PHONY: help web-install web-dev web-test web-lint ml-install pulse pulse-web ml-test ml-lint ml-format pre-commit up down

help:
	@echo "web-install   Install frontend dependencies (bun install)"
	@echo "web-dev       Start the Next.js dev server"
	@echo "web-test      Run frontend unit, integration and e2e tests"
	@echo "web-lint      Lint and format the web app"
	@echo "ml-install    Sync the backend virtualenv (uv sync)"
	@echo "pulse         Run the whole PULSE pipeline (backend/data/raw/xray -> backend/data/pulse/export)"
	@echo "pulse-web     Same, written into frontend/src/data/pulse (what the web app bundles)"
	@echo "ml-test       Run backend unit and integration tests"
	@echo "ml-lint       Lint backend with Ruff"
	@echo "ml-format     Format backend with Ruff"
	@echo "pre-commit    Run both apps' pre-commit checks"
	@echo "up / down     Start / stop the web app with Docker Compose"

web-install:
	cd frontend && bun install

web-dev:
	cd frontend && bun run dev

web-test:
	cd frontend && bun run test

web-lint:
	cd frontend && bun run lint-format

ml-install:
	cd backend && uv sync

pulse:
	$(MAKE) -C backend pulse

pulse-web:
	$(MAKE) -C backend pulse-web

ml-test:
	$(MAKE) -C backend test

ml-lint:
	$(MAKE) -C backend lint

ml-format:
	$(MAKE) -C backend format

pre-commit:
	cd frontend && bun run pre-commit
	$(MAKE) -C backend pre-commit

up:
	docker compose up --build

down:
	docker compose down
