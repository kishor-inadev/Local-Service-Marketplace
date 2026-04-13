# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.0 && break || sleep 2; done

COPY package*.json pnpm-lock.yaml* ./

RUN pnpm config set network-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# Prune dev dependencies so node_modules only has production deps
RUN pnpm prune --prod

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy pruned node_modules from builder (preserves pnpm symlink structure)
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist

RUN mkdir -p logs

EXPOSE 3003

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1

CMD ["node", "dist/main.js"]
