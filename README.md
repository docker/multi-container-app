# Multi Containers App

This is a repo for new users getting started with Docker.

You can try it out using the following command.

```docker compose up -d```

And open http://localhost:3000 in your browser.

## Build locally with BuildKit

This repository's `app/Dockerfile` uses BuildKit mount features for faster dev builds.
If you build the image locally enable BuildKit, for example:

```bash
DOCKER_BUILDKIT=1 docker build -t multi-container-app:dev ./app
docker run --rm -p 3000:3000 --name todo-app multi-container-app:dev
```

Or use Compose with BuildKit enabled:

```bash
DOCKER_BUILDKIT=1 docker compose up -d --build
```

If you cannot enable BuildKit, edit `app/Dockerfile` to replace `--mount` usages with
standard `COPY` commands before building.

## Local dev when Compose is running

If you keep the Compose stack running but still want to run the app locally (for example
to attach a debugger), disable live reload to avoid port 35729 conflicts:

```bash
cd app
LIVERELOAD=false PORT=3001 npm run dev
```

You can also run the smoke test after starting the app locally (or after Compose):

```bash
cd app
npm run smoke
```

## Build a production image

Build a production image (uses the `production` target which installs only production deps):

```bash
DOCKER_BUILDKIT=1 docker build --target production -t multi-container-app:prod ./app
```

Run the production image:

```bash
docker run --rm -p 3000:3000 multi-container-app:prod
```

To push the production image to GitHub Container Registry (example):

```bash
docker tag multi-container-app:prod ghcr.io/OWNER/multi-container-app:prod
docker login ghcr.io
docker push ghcr.io/OWNER/multi-container-app:prod
```

## Quick developer commands (Makefile)

If you have `make` installed, the repository includes a `Makefile` with useful shortcuts:

	make up         # build and start compose
	make down       # stop compose
	make prod       # build production image
	make run-smoke  # run smoke test
	make archive    # create a tar.gz archive of the repo

Use `docker-compose.override.yml` for a bind-mounted local dev flow (it enables livereload).
