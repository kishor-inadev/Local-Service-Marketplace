# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json pnpm-lock.yaml* ./

RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 600000

RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json pnpm-lock.yaml* ./

RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 600000

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p logs

EXPOSE 3007

USER node

CMD ["node", "dist/main.js"]
