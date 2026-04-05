# Local Service Marketplace – Architecture Guide

This document defines the **system architecture, services, infrastructure layers, and scaling strategy** for the Local Service Marketplace platform.

The system is designed so that **code is written once and infrastructure layers are enabled gradually without rewriting services**.

---

# 1. System Design Philosophy

The platform follows these principles:

1. Write services once
2. Enable infrastructure gradually
3. Never rewrite services when scaling
4. Maintain a production-grade database schema from the beginning
5. All backend services run in Docker containers
6. Services communicate through APIs or events
7. Infrastructure features are enabled via configuration flags

Scaling should require **infrastructure changes only, not business logic changes**.

---

# 2. Technology Stack

Frontend
Next.js

Backend
NestJS microservices

Database
PostgreSQL

Cache / Queue
Redis

Event Streaming (later stages)
Kafka

Search Engine (large scale)
Elasticsearch

Containerization
Docker

Orchestration (large scale)
Kubernetes

Hosting

Frontend → Vercel
Backend → containerized cloud services

---

# 3. System Architecture

System flow:

Users
↓
Frontend (Next.js)
↓
API Gateway
↓
Backend Microservices
↓
PostgreSQL Database

Optional infrastructure layers:

Redis cache
Background workers
Kafka event bus
Search engine

---

# 4. Microservices

The platform uses **6 backend microservices** (merged from original 13 for operational simplicity):

| Service | Port | Merged From | Responsibilities |
|---------|------|-------------|-----------------|
| identity-service | 3001 | auth + user + provider | Authentication, JWT, OAuth, user profiles, provider management |
| marketplace-service | 3003 | request + proposal + job + review | Service requests, proposals, jobs, reviews |
| payment-service | 3006 | — | Payment processing, refunds, escrow |
| comms-service | 3007 | notification + messaging | Email delivery, SMS/OTP, in-app notifications |
| oversight-service | 3010 | admin + analytics | Admin operations, disputes, analytics |
| infrastructure-service | 3012 | — | Feature flags, rate limits, background jobs, events |

Supporting services:
- **api-gateway** (port 3700) — single entry point, JWT validation, rate limiting
- **email-service** (port 3500 internal) — SMTP email delivery (Docker profile: `email`)
- **sms-service** (port 3000 internal) — SMS/OTP delivery (Docker profile: `sms`)

Each service:

- exposes REST APIs
- owns its database tables
- runs in a Docker container
- communicates via HTTP or events

---

# 5. Database Schema

The platform uses a **production-grade PostgreSQL schema from day one**.

The schema includes approximately **45 tables** covering:

Authentication
Marketplace core
Payments
Messaging
Notifications
Analytics
Infrastructure tables

Schema file:

```
database/schema.sql
```

This schema must **not change across scaling stages**.

All schema changes must be handled through **migrations**.

---

# 6. Microservice Data Ownership

Each service owns specific tables.

Service boundaries are defined in:

```
docs/MICROSERVICE_BOUNDARY_MAP.md
```

Rules:

- Services may only directly access their own tables
- Cross-service data access must occur via APIs or events
- Shared tables must have a clearly defined owner

---

# 7. Database Optimization

Primary keys use UUID.

Important indexes include:

service_requests(user_id)
service_requests(category_id)
proposals(request_id)
jobs(provider_id)
reviews(provider_id)
notifications(user_id)
messages(job_id)
payments(job_id)

All list APIs must support pagination.

Example:

```
GET /requests?limit=20&cursor=xyz
```

Avoid cross-service joins.

---

# 8. API Gateway

An API gateway should be deployed early.

Responsibilities:

- request routing
- authentication middleware
- rate limiting
- request logging
- response caching

Common implementations:

NGINX
Envoy
Kong

---

# 9. Dockerized Services

Every backend service must include a Dockerfile.

Example Node Dockerfile

```
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm","run","start"]
```

Example Go Dockerfile

```
FROM golang:1.22-alpine

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o server

EXPOSE 3000

CMD ["./server"]
```

---

# 10. Local Development Environment

Local development uses Docker Compose.

Configuration file:

```
docker/docker-compose.yml
```

Core services:

PostgreSQL
Redis (optional)
API Gateway (port 3700)
identity-service
marketplace-service
payment-service
comms-service
oversight-service

---

# 11. Running the Platform Locally

Start services

```
docker compose up --build
```

Run in background

```
docker compose up -d
```

Stop services

```
docker compose down
```

---

# 12. Scaling Strategy

The system supports **five scaling levels**.

---

## Level 1 – MVP

Infrastructure

Frontend → Vercel
Backend → API services
Database → PostgreSQL

Capacity

200–350 concurrent users

---

## Level 2 – Cache Layer

Enable Redis caching.

Benefits

Reduced database load
Faster responses

Capacity

500–1000 concurrent users

---

## Level 3 – Worker Layer

Enable background workers.

Workers handle:

email notifications
analytics processing
payment retries
notification delivery

Capacity

2000+ concurrent users

---

## Level 4 – Event Driven Architecture

Enable Kafka event streaming.

Example events:

request_created
proposal_submitted
job_started
payment_completed
review_submitted

Capacity

10k+ concurrent users

---

## Level 5 – Distributed Platform

Add:

Kubernetes
CDN
Elasticsearch
Redis cluster
Database read replicas

Capacity

50k+ concurrent users

---

# 13. Observability

Monitoring stack should include:

Prometheus
Grafana
OpenTelemetry
Centralized logging

---

# 14. Security Requirements

Passwords must be hashed using bcrypt.

Authentication uses JWT tokens.

Security features:

email verification
password reset
login rate limiting
audit logs
device tracking

Sensitive actions must be logged in audit_logs.

---

# 15. Development Guidelines

Use UUID primary keys.

Always paginate large queries.

Avoid cross-service database access.

Communicate between services using APIs or events.

Cache frequently accessed data.

Keep services loosely coupled.

---

# 16. Repository Structure

```
marketplace-platform

frontend
 └── nextjs-app

gateway
 └── api-gateway

services
 ├── identity-service
 ├── marketplace-service
 ├── payment-service
 ├── comms-service
 ├── oversight-service
 └── infrastructure-service

workers
 └── background-worker

database
 ├── schema.sql
 └── migrations

docker
 └── docker-compose.yml

docs
 ├── ARCHITECTURE.md
 ├── MICROSERVICE_BOUNDARY_MAP.md
 └── SCALING_STRATEGY.md
```

---

# 17. Architecture Guarantee

This architecture ensures:

- one-time service development
- stable database schema
- infrastructure-driven scaling
- minimal service coupling

The system can scale from **MVP to large distributed platform without service rewrites**.

---

End of Architecture Guide
