# ─────────────────────────────────────────────
# SENTINEL — Production Web Dashboard Dockerfile (Multi-stage)
# ─────────────────────────────────────────────

# ── Stage 1: Build Environment ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace package manifests
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/shared/package.json ./packages/shared/
COPY packages/validation/package.json ./packages/validation/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy source trees
COPY packages/types ./packages/types
COPY packages/shared ./packages/shared
COPY packages/validation ./packages/validation
COPY apps/web ./apps/web

# Build shared packages and frontend bundle
RUN npm run build:types
RUN npm run build:shared
RUN npm run build:validation
RUN npm run build:web

# ── Stage 2: Production Nginx Server ──
FROM nginx:1.25-alpine AS runner

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy custom Nginx gateway configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy production static build artifacts
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

# Web healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
