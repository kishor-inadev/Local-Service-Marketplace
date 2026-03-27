# ============================================
# SMS Service - Node.js (JavaScript)
# ============================================
# This is a plain Node.js service (not TypeScript)
# No build step required - just copy and run
# ============================================

FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN OPENSSL_CONF=/dev/null npm install -g pnpm

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S smsuser -u 1001

# Copy package files
COPY package.json pnpm-lock.yaml* package-lock.json* ./

# Install production dependencies only
# Use npm if pnpm-lock.yaml doesn't exist
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm install --prod --frozen-lockfile; \
    else \
      npm ci --omit=dev; \
    fi

# Copy source code (JavaScript, no compilation needed)
COPY --chown=smsuser:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown -R smsuser:nodejs logs

# Switch to non-root user
USER smsuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-3000}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "index.js"]
