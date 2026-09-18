# Root task runner. Delegates to each app; keep it thin.

.PHONY: help web-install web-dev web-test web-lint ml-install ml-main ml-test ml-lint ml-format pre-commit

help:
	@echo "web-install   Install frontend dependencies (bun install)"
	@echo "web-dev       Start the Next.js dev server with its database"
	@echo "web-test      Run frontend unit, integration and e2e tests"
	@echo "web-lint      Lint and format the web app"
	@echo "ml-install    Sync the backend virtualenv (uv sync)"
	@echo "ml-main       Run the backend entry point"
	@echo "ml-test       Run backend unit and integration tests"
	@echo "ml-lint       Lint backend with Ruff"
	@echo "ml-format     Format backend with Ruff"
	@echo "pre-commit    Run both apps' pre-commit checks"

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

ml-main:
	$(MAKE) -C backend main

ml-test:
	$(MAKE) -C backend test

ml-lint:
	$(MAKE) -C backend lint

ml-format:
	$(MAKE) -C backend format

pre-commit:
	cd frontend && bun run pre-commit
	$(MAKE) -C backend pre-commit
