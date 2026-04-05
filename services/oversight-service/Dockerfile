# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable ; (corepack prepare pnpm@9.12.3 --activate || corepack prepare pnpm@9.12.3 --activate || corepack prepare pnpm@9.12.3 --activate || npm install -g pnpm@9.12.3 --force)

COPY package*.json pnpm-lock.yaml* ./

RUN pnpm config set network-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000

RUN pnpm install

COPY . .

RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN corepack enable ; (corepack prepare pnpm@9.12.3 --activate || corepack prepare pnpm@9.12.3 --activate || corepack prepare pnpm@9.12.3 --activate || npm install -g pnpm@9.12.3 --force)

COPY package*.json pnpm-lock.yaml* ./

RUN pnpm config set network-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000

RUN pnpm install --prod

COPY --from=builder /app/dist ./dist

RUN mkdir -p logs

EXPOSE 3010

USER node

CMD ["node", "dist/main.js"]
