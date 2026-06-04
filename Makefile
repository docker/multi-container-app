# Makefile with common development tasks

.PHONY: up down build prod run-smoke archive clean

up:
	docker compose up -d --build

down:
	docker compose down

build:
	DOCKER_BUILDKIT=1 docker build -t multi-container-app-todo-app ./app

prod:
	DOCKER_BUILDKIT=1 docker build --target production -t multi-container-app:prod ./app

run-smoke:
	cd app && npm run smoke

archive:
	tar -C /workspaces -czf /workspaces/multi-container-app-archive.tar.gz multi-container-app

clean:
	docker system prune -f --volumes || true
	rm -f /workspaces/multi-container-app-archive.tar.gz || true
