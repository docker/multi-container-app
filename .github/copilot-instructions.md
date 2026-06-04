## Purpose

These instructions are written for AI coding agents (Copilot-style) to be immediately productive in this repository:
- Small example multi-container Node.js + Mongo app using Express + EJS
- App lives under `app/`. Compose file `compose.yaml` defines two services: `todo-app` and `todo-database` (MongoDB).

## Big-picture architecture

- Services:
  - `todo-app` (service code in `app/`) — Express server, EJS views, one router at `routes/front.js`.
  - `todo-database` — Mongo image (see `compose.yaml`).
- Data flow: HTTP forms -> `routes/front.js` -> Mongoose models (`models/Todo.js`) -> MongoDB service `todo-database`.
- Why structure: repository is intentionally minimal to demonstrate multi-container local development with a separate DB service. `config/keys.js` centralizes the connection string and prefers the environment variable `MONGO_PROD_URI`.

## Key files (quick map)

- `app/server.js` — app entry point (sets EJS, livereload, connects DB via `config/keys.js`, mounts `routes/front.js`). Note: `package.json` scripts start `server.js`.
- `app/package.json` — scripts: `start` (production) and `dev` (nodemon + ejs). Dev tools are in `devDependencies`.
- `app/Dockerfile` — builds the image, installs dependencies (uses cache/bind mounts), installs `nodemon` globally and runs `npm run dev` by default.
- `compose.yaml` — defines services, port mappings (3000 and livereload 35729), and a `develop.watch` block used by some Docker dev workflows.
- `app/config/keys.js` — exports `mongoProdURI` and defaults to `mongodb://todo-database:27017/todoapp` when `MONGO_PROD_URI` not set.
- `app/models/Todo.js` — Mongoose schema (validation rules, enums, default values, indexes). Exports model named `todos`.
- `app/routes/front.js` — All HTTP endpoints: list GET `/`, POST `/` (create), and POST subroutes for destroy, edit, toggle.
- `app/views/todos.ejs` — front-end template (EJS) that renders `tasks` and uses `app.locals.moment` for date formatting.

## Project-specific conventions & patterns

- Single-router, thin controllers: `routes/front.js` performs model calls directly (no service layer).
- Model naming: `module.exports = Todo = mongoose.model('todos', TodoSchema);` — collection name is `'todos'` (lowercase). Use that pattern when adding models.
- Validation is implemented in the schema (see `task` field regex preventing `<` and `>`), so prefer schema-level validation over manual checks.
- Template variables: server sets `app.locals.moment = moment` so templates call `moment(...)` directly.
- Live reload: server uses `livereload` + `connect-livereload` and Compose maps port `35729` for the livereload client. Dev workflow expects nodemon + livereload rather than a manual rebuild loop.

## Dev / build / run workflows (explicit commands)

- Run with Docker Compose (recommended local flow):

  docker compose up -d

  Then open http://localhost:3000

- Run the Node app locally (inside `app/`) without Docker:

  cd app
  npm ci
  npm run dev    # uses nodemon and livereload

- Run production locally (without hot reload):

  cd app
  npm ci --production
  npm start

- Notes about Dockerfile & compose:
  - `app/Dockerfile` sets `CMD npm run dev` — the image is set up for the dev hot-reload flow by default.
  - `compose.yaml` exposes port 3000 (app) and 35729 (livereload). The mongo service is `todo-database:27017` — matches `config/keys.js` default URI.

## Integration points & environment

- MongoDB connection: override with env var `MONGO_PROD_URI` (see `app/config/keys.js`). When running under Compose, the default host is `todo-database`.
- Ports: 3000 (app), 35729 (livereload), 27017 (mongo).

- Host-mounted DB for extra storage: Compose supports an optional host bind for MongoDB data via the `HOST_DB_PATH` environment variable. If `HOST_DB_PATH` is set when running Compose, the service will bind that host directory into the container at `/data/db` (otherwise a named volume `database` is used). Example:

  HOST_DB_PATH=/mnt/big-disk/docker-mongo-data docker compose up -d

## Env files and local secrets

- A `.env.example` is provided at the repo root. Copy it to `.env` for local development and update values (do NOT commit `.env`). Key variables:
  - `MONGO_PROD_URI` — Mongo connection string
  - `LIVERELOAD` / `LIVERELOAD_PORT` — control livereload behavior
  - `PORT` — application port

## CI

- A GitHub Actions workflow is included at `.github/workflows/ci.yml`. It builds the production image (BuildKit), runs the container, waits for the root endpoint to respond, and performs a smoke test. Use this as a template if you add tests or integrate with CD pipelines.

## Code change patterns & examples

- Add a new route: create `app/routes/<name>.js`, export an Express router and mount it in `app/server.js` via `app.use('/prefix', require('./routes/<name>'))`.

- Add a model: create `app/models/Name.js` using Mongoose Schema. Follow `models/Todo.js` style: include field-level validation, enums where applicable and export with a lowercase collection name.

- Example: toggle completion (existing pattern)

  // in `routes/front.js`
  const todo = await Todo.findById(taskKey);
  todo.completed = !todo.completed;
  await todo.save();

This code style prefers small atomic DB operations and redirecting to `/` after POSTs.

## Things an agent should watch for

- `package.json` `main` field is `app.js` but the runtime uses `server.js` — rely on the `scripts` section for commands.
- Mongoose options in `server.js` include `useNewUrlParser: true` which is a no-op in latest Mongoose versions; avoid changing unless you run tests.
- There are no automated tests or CI in the repo — changes should be validated manually by running the app and exercising endpoints.

## Quick search hints (useful file queries)

- Routes: `app/routes/**/*.js`
- Models: `app/models/**/*.js`
- Views: `app/views/**/*.ejs`
- Docker-compose: `compose.yaml`

## If you modify the container/dev flow

- If you change the Dockerfile CMD to `npm start`, update `compose.yaml` or document how to run the container for dev vs prod.
- If you add a new service that other services must reach by DNS, update `compose.yaml` service name and any defaults in `config/keys.js`.

---
If anything here is unclear or you'd like additional examples (e.g., adding REST JSON endpoints instead of POST+redirect, or a short migration to a service layer), tell me which area to expand and I will iterate.
