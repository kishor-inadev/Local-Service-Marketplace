# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable ; (corepack prepare pnpm@9.12.3 --activate || corepack prepare pnpm@9.12.3 --activate || corepack prepare pnpm@9.12.3 --activate || npm install -g pnpm@9.12.3 --force)

# Copy package files
COPY package*.json pnpm-lock.yaml* ./

# Configure pnpm for slow/unreliable networks
RUN pnpm config set network-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable ; (corepack prepare pnpm@9.12.3 --activate || corepack prepare pnpm@9.12.3 --activate || corepack prepare pnpm@9.12.3 --activate || npm install -g pnpm@9.12.3 --force)

# Copy package files
COPY package*.json pnpm-lock.yaml* ./

# Configure pnpm for slow/unreliable networks
RUN pnpm config set network-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000

# Install production dependencies only
RUN pnpm install --prod

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3001

# Set non-root user
USER node

# Start application
CMD ["node", "dist/src/main.js"]
