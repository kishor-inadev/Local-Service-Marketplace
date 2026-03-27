# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN OPENSSL_CONF=/dev/null npm install -g pnpm

COPY package*.json pnpm-lock.yaml* ./

# Configure pnpm for slow/unreliable networks
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

# Install pnpm
RUN OPENSSL_CONF=/dev/null npm install -g pnpm

COPY package*.json pnpm-lock.yaml* ./

# Configure pnpm for slow/unreliable networks
RUN pnpm config set network-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000

RUN pnpm install --prod

COPY --from=builder /app/dist ./dist

EXPOSE 3006

CMD ["node", "dist/src/main"]
