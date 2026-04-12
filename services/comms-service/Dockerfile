# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm with retries; fallback to npm global install if corepack fetch is unstable
RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.0 && break || sleep 2; done

COPY package*.json pnpm-lock.yaml* ./

RUN pnpm config set network-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000

RUN sh -c "for i in 1 2 3; do pnpm install --frozen-lockfile && exit 0; echo 'pnpm install failed, retrying...'; sleep 5; done; exit 1"

COPY . .

RUN pnpm run build

RUN pnpm prune --prod

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.0 && break || sleep 2; done

COPY package*.json pnpm-lock.yaml* ./

RUN pnpm config set network-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

RUN mkdir -p logs

EXPOSE 3007

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3007/health || exit 1

CMD ["node", "dist/main.js"]
