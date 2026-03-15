# System Architecture Diagrams

This document provides **visual architecture diagrams for all scaling stages** of the Local Service Marketplace.

The system is designed so that:

- services remain unchanged
- database schema remains stable
- infrastructure layers are enabled gradually

---

# Level 1 – MVP Architecture

Goal: Launch quickly.

Infrastructure

Frontend → Vercel
Backend → API services
Database → PostgreSQL

Diagram

Users
↓
Next.js Frontend
↓
API Gateway
↓
Backend Services
↓
PostgreSQL

Services running

auth-service
user-service
request-service
proposal-service
job-service
payment-service
notification-service

Capacity

200–350 concurrent users

---

# Level 2 – Cache Architecture

Goal: Reduce database load.

New component

Redis cache

Diagram

Users
↓
Next.js Frontend
↓
API Gateway
↓
API Services
↓
Redis Cache
↓
PostgreSQL

Cached data

service categories
provider profiles
popular requests
frequently accessed data

Capacity

500–1000 concurrent users

---

# Level 3 – Worker Architecture

Goal: Move heavy tasks out of API requests.

New component

Background worker services

Diagram

Users
↓
Next.js Frontend
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

Worker tasks

send emails
process notifications
analytics aggregation
payment retry handling
report generation

Capacity

2000+ concurrent users

---

# Level 4 – Event Driven Architecture

Goal: Decouple microservices.

New component

Kafka event bus

Diagram

Users
↓
Next.js Frontend
↓
API Gateway
↓
Microservices
↓
Kafka Event Bus
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

Benefits

services become independent
asynchronous processing
high scalability

Capacity

10k+ concurrent users

---

# Level 5 – Distributed Platform

Goal: Enterprise scale.

New components

Kubernetes
CDN
Redis cluster
PostgreSQL read replicas
Elasticsearch search

Diagram

Users
↓
CDN
↓
Load Balancer
↓
API Gateway
↓
Microservices Cluster (Kubernetes)
↓
Kafka Event Bus
↓
Redis Cluster
↓
PostgreSQL Cluster
↓
Elasticsearch Search

Benefits

horizontal scaling
high availability
fault tolerance

Capacity

50k+ concurrent users

---

# Infrastructure Evolution

The infrastructure evolves gradually.

Level 1

Frontend
API Services
PostgreSQL

Level 2

- Redis cache

Level 3

- Background workers

Level 4

- Kafka event streaming

Level 5

- Kubernetes cluster
- distributed cache
- search engine

---

# Key Architecture Principle

The architecture ensures:

Code remains unchanged
Infrastructure evolves gradually
Database schema stays stable

This allows scaling without rewriting services.

---

End of System Architecture Diagrams
