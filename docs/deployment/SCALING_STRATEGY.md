# Scaling Strategy

This document explains how to scale the Local Service Marketplace from a simple MVP up to an enterprise-grade distributed system.

**The key principle: code never changes. Only infrastructure is enabled gradually via feature flags and Docker Compose overlay files.**

---

## Quick Start — Pick Your Level

```powershell
# Level 1 — MVP (no extras)
docker compose up -d

# Level 2 — Add Redis cache
docker compose -f docker-compose.yml -f docker-compose.level2.yml --profile cache up -d

# Level 3 — Add background workers
docker compose -f docker-compose.yml -f docker-compose.level3.yml --profile workers up -d

# Level 4 — Add Kafka event bus
docker compose -f docker-compose.yml -f docker-compose.level4.yml --profile events up -d

# Level 5 — Full scale (all infrastructure)
docker compose -f docker-compose.yml -f docker-compose.level5.yml --profile full up -d
```

Or use the helper script:

```powershell
.\scripts\scale.ps1 -Level 2          # start at level 2
.\scripts\scale.ps1 -Level 3 -Build   # rebuild images then start at level 3
.\scripts\scale.ps1 -Level 5          # full scale
```

---

## Compose Files Reference

| File | Purpose |
|---|---|
| `docker-compose.yml` | Base — always required |
| `docker-compose.level2.yml` | Overlay — enables Redis cache |
| `docker-compose.level3.yml` | Overlay — enables workers + cache |
| `docker-compose.level4.yml` | Overlay — enables Kafka events |
| `docker-compose.level5.yml` | Overlay — full scale (all services) |

Overlays are **additive** — each level includes everything from the level below.

---

## Feature Flags

Services check these environment variables at startup. Changing the level sets them automatically via the overlay file.

| Flag | Default | Set by |
|---|---|---|
| `CACHE_ENABLED` | `false` | Level 2+ |
| `WORKERS_ENABLED` | `false` | Level 3+ |
| `EVENT_BUS_ENABLED` | `false` | Level 4+ |
| `REDIS_RATE_LIMIT_ENABLED` | `false` | Level 5 |
| `DEVICE_TRACKING_ENABLED` | `false` | Level 5 |

Services degrade gracefully when a flag is `false` — no errors, just skips that path.

---

---

## Level 1 — MVP

**Target:** 200–500 concurrent users  
**Extra infrastructure:** None

```powershell
docker compose up -d
```

```
Frontend (Vercel)
      ↓
API Gateway :3700
      ↓
6 Microservices
      ↓
PostgreSQL
```

What's active:
- All 6 backend services + API Gateway
- PostgreSQL database
- No cache, no workers, no events

Rules to stay healthy at this level:
- Always paginate — never return unbounded lists
- Use DB indexes on foreign keys and `created_at`
- Keep API responses lean

---

## Level 2 — Cache Layer

**Target:** 500–1 000 concurrent users  
**Extra infrastructure:** Redis (256 MB)

```powershell
.\scripts\scale.ps1 -Level 2
```

Environment changes applied automatically:
```env
CACHE_ENABLED=true
REDIS_URL=redis://redis:6379
```

```
Frontend (Vercel)
      ↓
API Gateway :3700
      ↓
6 Microservices ──→ Redis Cache
      ↓
PostgreSQL
```

What gets cached:
- Service categories
- Provider profiles
- Popular services
- Recent service requests

---

## Level 3 — Worker Layer

**Target:** 2 000+ concurrent users  
**Extra infrastructure:** Redis queues + background workers

```powershell
.\scripts\scale.ps1 -Level 3
```

Environment changes applied automatically:
```env
CACHE_ENABLED=true
WORKERS_ENABLED=true
WORKER_CONCURRENCY=10
```

```
Frontend (Vercel)
      ↓
API Gateway :3700
      ↓
6 Microservices ──→ Redis Queue ──→ Workers
      ↓
PostgreSQL
```

Workers handle (non-blocking, retriable):
- Email & SMS notification delivery
- Analytics event processing
- Payment retry logic
- Report generation

---

## Level 4 — Event-Driven

**Target:** 10 000+ concurrent users  
**Extra infrastructure:** Kafka + Zookeeper

```powershell
.\scripts\scale.ps1 -Level 4
```

Environment changes applied automatically:
```env
CACHE_ENABLED=true
WORKERS_ENABLED=true
EVENT_BUS_ENABLED=true
KAFKA_BROKERS=kafka:29092
```

```
Frontend (Vercel)
      ↓
API Gateway :3700
      ↓
Microservices ──→ Kafka ──→ Event Consumers
      ↓              ↓
PostgreSQL      Redis Cache/Queue
```

Events published:
- `request_created`
- `proposal_submitted`
- `job_started`
- `payment_completed`
- `review_submitted`

---

## Level 5 — Full Scale

**Target:** 50 000+ concurrent users  
**Extra infrastructure:** All of the above + infrastructure-service, rate limiting, device tracking

```powershell
.\scripts\scale.ps1 -Level 5
```

Environment changes applied automatically:
```env
CACHE_ENABLED=true
WORKERS_ENABLED=true
EVENT_BUS_ENABLED=true
REDIS_RATE_LIMIT_ENABLED=true
DEVICE_TRACKING_ENABLED=true
WORKER_CONCURRENCY=20
DB_POOL_MAX=30
```

Additional services activated:
- `infrastructure-service :3012` — feature flags, background jobs, rate limits, event log

Next steps beyond Level 5 (manual):
- Add Kubernetes for horizontal pod autoscaling
- Add CDN (CloudFront / Cloudflare) in front of Vercel
- PostgreSQL read replicas for heavy read queries
- Redis Cluster for high-availability caching

---

## Scaling Philosophy

> **Code stays the same. Infrastructure evolves.**

Services are written to check feature flags at runtime. Upgrading from Level 1 to Level 5 requires only restarting containers with the new overlay — no code deployments, no schema changes.

---

## Troubleshooting

**Redis not connecting after enabling Level 2:**
```powershell
docker compose logs redis
# Ensure REDIS_URL is set correctly in service env
```

**Workers not processing jobs:**
```powershell
docker compose logs comms-service
# Check WORKERS_ENABLED=true is in the running container
docker compose exec comms-service env | grep WORKERS
```

**Kafka consumers not receiving events:**
```powershell
docker compose logs kafka
# Allow 30-60s for Kafka to fully start before services connect
```
