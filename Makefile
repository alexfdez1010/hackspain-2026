# Root task runner. Delegates to each app; keep it thin.

.PHONY: help web-install web-dev web-test web-lint ml-install ml-main ml-test ml-lint ml-format pre-commit

help:
	@echo "web-install   Install web dependencies (bun install)"
	@echo "web-dev       Start the Next.js dev server with its database"
	@echo "web-test      Run web unit, integration and e2e tests"
	@echo "web-lint      Lint and format the web app"
	@echo "ml-install    Sync the ml-service virtualenv (uv sync)"
	@echo "ml-main       Run the ml-service entry point"
	@echo "ml-test       Run ml-service unit and integration tests"
	@echo "ml-lint       Lint ml-service with Ruff"
	@echo "ml-format     Format ml-service with Ruff"
	@echo "pre-commit    Run both apps' pre-commit checks"

web-install:
	cd web && bun install

web-dev:
	cd web && bun run dev

web-test:
	cd web && bun run test

web-lint:
	cd web && bun run lint-format

ml-install:
	cd ml-service && uv sync

ml-main:
	$(MAKE) -C ml-service main

ml-test:
	$(MAKE) -C ml-service test

ml-lint:
	$(MAKE) -C ml-service lint

ml-format:
	$(MAKE) -C ml-service format

pre-commit:
	cd web && bun run pre-commit
	$(MAKE) -C ml-service pre-commit
