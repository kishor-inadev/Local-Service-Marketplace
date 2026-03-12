# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Configure npm for slower networks
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Configure npm for slower networks
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3008

CMD ["node", "dist/src/main"]
