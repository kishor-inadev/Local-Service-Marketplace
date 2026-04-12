# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.0 && break || sleep 2; done

# Copy package files
COPY package*.json pnpm-lock.yaml* ./

# Configure pnpm for slow/unreliable networks
RUN pnpm config set network-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.0 && break || sleep 2; done

# Copy package files
COPY package*.json pnpm-lock.yaml* ./

# Configure pnpm for slow/unreliable networks
RUN pnpm config set network-timeout 600000 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create logs directory
RUN mkdir -p logs && chown -R node:node logs

# Create uploads directory with proper permissions
RUN mkdir -p uploads && chown -R node:node uploads

# Expose port
EXPOSE 3001

# Set non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# Start application
CMD ["node", "dist/main.js"]
