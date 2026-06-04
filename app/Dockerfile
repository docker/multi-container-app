# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

ARG NODE_VERSION=19.5.0

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production

# NOTE: This Dockerfile uses BuildKit features (the `--mount=type=bind` form in the
# `RUN` instruction). To build locally you must enable BuildKit, for example:
#
#   DOCKER_BUILDKIT=1 docker build -t multi-container-app:dev ./app
#
# If you cannot use BuildKit, remove the `--mount=type=bind` / `--mount=type=cache`
# usages and replace them with standard COPY steps. The current file is optimized
# for a fast developer rebuild flow when BuildKit is available.


WORKDIR /usr/src/app

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --include=dev

# install nodemon for hot-reloading
COPY .npmrc .
RUN npm install -g nodemon

# Copy the rest of the source files into the image.
COPY . .


# Run the application as a non-root user.
RUN  chown -R node /usr/src/app
USER node

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application in dev mode to use with Compose watch feature
CMD npm run dev


# --- Production stage (multi-stage build)
FROM node:${NODE_VERSION}-alpine AS production

WORKDIR /usr/src/app

# Install only production dependencies for a smaller runtime image
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Run as non-root
RUN chown -R node /usr/src/app
USER node

EXPOSE 3000

# A simple healthcheck (optional, uses /)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://localhost:3000/ || exit 1

# Production entrypoint
CMD [ "npm", "start" ]

