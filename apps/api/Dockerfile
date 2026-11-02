# ─────────────────────────────────────────────
# SENTINEL — Production API Dockerfile (Multi-stage)
# ─────────────────────────────────────────────

# ── Stage 1: Build Environment ──
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy workspace package manifests
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/shared/package.json ./packages/shared/
COPY packages/validation/package.json ./packages/validation/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm ci

# Copy source trees
COPY packages/types ./packages/types
COPY packages/shared ./packages/shared
COPY packages/validation ./packages/validation
COPY apps/api ./apps/api

# Build all dependencies and API application
RUN npm run build:types
RUN npm run build:shared
RUN npm run build:validation
RUN npm run build:api

# Prune development packages for minimal production image
RUN npm prune --omit=dev

# ── Stage 2: Minimal Production Runner ──
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV MQTT_PORT=1883

# Add dumb-init for proper signal forwarding and PID 1 reaping
RUN apk add --no-cache dumb-init wget

# Copy runtime node_modules and built dist artifacts
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages ./packages
COPY --from=builder --chown=node:node /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/package.json ./package.json

# Run as unprivileged node user
USER node

EXPOSE 4000 1883

# Native Docker / Kubernetes healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/v1/health/live || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/index.js"]
