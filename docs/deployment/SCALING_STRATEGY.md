# Scaling Strategy

This document describes how the Local Service Marketplace scales from **MVP to a distributed system**.

The architecture is designed so that **services and database schema do not need to be rewritten when scaling**.

Only infrastructure layers are enabled gradually.

---

# Level 1 – MVP

Goal: Launch quickly with minimal infrastructure.

Infrastructure

Frontend → Vercel
Backend → Docker containers or serverless APIs
Database → PostgreSQL

Architecture

Users
↓
Next.js
↓
API Gateway
↓
Backend Services
↓
PostgreSQL

Capacity

200–350 concurrent users

Key rules

- Use pagination
- Avoid heavy joins
- Limit API responses
- Use database indexes

---

# Level 2 – Cache Layer

Goal: Reduce database load.

Add

Redis cache

Architecture

Users
↓
Next.js
↓
API Gateway
↓
API Services
↓
Redis Cache
↓
PostgreSQL

What gets cached

service categories
provider profiles
popular services
recent requests

Capacity

500–1000 concurrent users

---

# Level 3 – Worker Layer

Goal: Move heavy tasks outside API requests.

Add

Background workers

Architecture

Users
↓
API Gateway
↓
API Services
↓
Redis Queue
↓
Worker Services
↓
PostgreSQL

Workers process

email notifications
analytics events
payment retries
notification delivery
report generation

Capacity

2000+ concurrent users

---

# Level 4 – Event Driven Architecture

Goal: Decouple services.

Add

Kafka event bus

Architecture

Users
↓
API Gateway
↓
Microservices
↓
Kafka
↓
Event Consumers
↓
PostgreSQL + Redis

Example events

request_created
proposal_submitted
job_started
payment_completed
review_submitted

Capacity

10k+ concurrent users

---

# Level 5 – Distributed Platform

Goal: Enterprise scale marketplace.

Add

Kubernetes
CDN
Elasticsearch
Redis cluster
PostgreSQL read replicas

Architecture

Users
↓
CDN
↓
Load Balancer
↓
API Gateway
↓
Microservices Cluster
↓
Kafka Event Bus
↓
Redis Cluster
↓
PostgreSQL Cluster

Capacity

50k+ concurrent users

---

# Infrastructure Flags

Services must support feature flags so infrastructure can be enabled without code changes.

Example environment variables

CACHE_ENABLED=true
WORKERS_ENABLED=true
EVENT_BUS_ENABLED=true

At MVP stage

CACHE_ENABLED=false
WORKERS_ENABLED=false
EVENT_BUS_ENABLED=false

---

# Scaling Philosophy

Scaling must follow this rule:

Code stays the same
Infrastructure evolves

Services should never require rewrites to scale.
