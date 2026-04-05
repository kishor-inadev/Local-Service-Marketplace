# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm with retries; fallback to npm global install if corepack fetch is unstable
RUN corepack enable && sh -c "for i in 1 2 3; do corepack prepare pnpm@9.12.3 --activate && exit 0; echo 'corepack prepare failed, retrying...'; sleep 5; done; npm install -g pnpm@9.12.3 --force"

COPY package*.json pnpm-lock.yaml* ./

RUN pnpm config set network-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000

RUN sh -c "for i in 1 2 3; do pnpm install && exit 0; echo 'pnpm install failed, retrying...'; sleep 5; done; exit 1"

COPY . .

RUN pnpm run build

RUN pnpm prune --prod

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json pnpm-lock.yaml* ./

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p logs

EXPOSE 3007

USER node

CMD ["node", "dist/main.js"]
