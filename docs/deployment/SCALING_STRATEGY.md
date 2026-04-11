# Scaling Strategy

This document explains **how to scale the Local Service Marketplace** from a zero-cost MVP to a fully distributed enterprise system.

**Core principle: application code never changes. Only the infrastructure beneath it grows — controlled entirely by Docker Compose overlay files and feature flags.**

---

## Overview — 5 Levels

| Level | Users | Monthly Cost (est.) | Infrastructure |
|-------|-------|---------------------|----------------|
| 1 — MVP | 0–500 | **$0** (free tier) | Postgres only |
| 2 — Cache | 500–2,000 | $5–$20 | + Redis |
| 3 — Workers | 2,000–10,000 | $20–$80 | + BullMQ workers |
| 4 — Events | 10,000–50,000 | $80–$300 | + Kafka |
| 5 — Full Scale | 50,000+ | $300+ | + K8s / replicas |

---

## Quick Start — Pick Your Level

```powershell
# Level 1 — MVP (zero extras)
docker-compose up -d

# Level 2 — Add Redis cache
docker-compose -f docker-compose.yml -f docker-compose.level2.yml --profile cache up -d

# Level 3 — Add background workers
docker-compose -f docker-compose.yml -f docker-compose.level3.yml --profile workers up -d

# Level 4 — Add Kafka event bus
docker-compose -f docker-compose.yml -f docker-compose.level4.yml --profile events up -d

# Level 5 — Full scale (all infrastructure)
docker-compose -f docker-compose.yml -f docker-compose.level5.yml --profile full up -d
```

Or use the helper script:

```powershell
.\scripts\scale.ps1 -Level 2          # start at level 2
.\scripts\scale.ps1 -Level 3 -Build   # rebuild images then start level 3
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

| Flag | Default | Enabled at |
|---|---|---|
| `CACHE_ENABLED` | `false` | Level 2+ |
| `WORKERS_ENABLED` | `false` | Level 3+ |
| `EVENT_BUS_ENABLED` | `false` | Level 4+ |
| `REDIS_RATE_LIMIT_ENABLED` | `false` | Level 5 |
| `DEVICE_TRACKING_ENABLED` | `false` | Level 5 |

Services degrade gracefully when a flag is `false` — no errors, just skips that path.

---

## Level 1 — MVP

**Target:** 0–500 concurrent users  
**Monthly cost: $0** (fully free tier hosting)

### Infrastructure

```
Browser
  ↓
Frontend — Vercel (free)
  ↓
API Gateway + 6 Services — Render free tier / Railway / Fly.io
  ↓
PostgreSQL — Neon free tier (0.5 GB) / Supabase free tier (500 MB)
```

### Start

```powershell
docker-compose up -d
```

### Free Hosting Setup

#### Option A — Render.com (recommended for simplicity)

1. **PostgreSQL** → Neon.tech free tier
   - Go to https://neon.tech
   - Create project → copy `DATABASE_URL`
   - Supports 0.5 GB, unlimited connections via pgbouncer

2. **Backend services** → Render free tier (7 services)
   - Go to https://render.com
   - New → Web Service → connect GitHub repo
   - Root directory: `services/identity-service`
   - Build: `pnpm install && pnpm build`
   - Start: `pnpm start:prod`
   - Add env vars from `docker.env`
   - Repeat for each service
   - **Free tier:** services sleep after 15 min idle (acceptable for MVP)

3. **Frontend** → Vercel free tier
   - Go to https://vercel.com
   - Import GitHub repo → set root to `frontend/`
   - Add `NEXT_PUBLIC_API_URL=https://your-gateway.onrender.com`
   - Auto-deploys on push to main

4. **Redis** → Not needed at Level 1. Skip.

#### Option B — Railway.app

1. New project → Deploy from GitHub
2. Add services: select service directory per service
3. Railway auto-detects `pnpm` and builds
4. Add PostgreSQL plugin → copy `DATABASE_URL`
5. Free tier: $5 credit/month (enough for MVP)

#### Option C — Fly.io

```bash
# Deploy each service
cd services/identity-service
fly launch --name marketplace-identity
fly secrets set JWT_SECRET=... DATABASE_URL=...
fly deploy
```

Free tier: 3 shared-CPU VMs, 256 MB RAM each (enough for 5 light services).

### What's Active

- All 6 backend services + API Gateway
- PostgreSQL database
- No cache, no workers, no events

### Limits at Level 1

- Always paginate — never return unbounded lists
- Use DB indexes on foreign keys and `created_at`
- Keep API responses lean (no N+1 queries)
- Email/SMS via external providers (Gmail SMTP / Brevo free)

---

## Level 2 — Cache Layer

**Target:** 500–2,000 concurrent users  
**Monthly cost: ~$5–$20**  
**Add:** Redis

### Infrastructure

```
Browser
  ↓
Frontend — Vercel
  ↓
API Gateway
  ↓
6 Microservices ──→ Redis Cache (256 MB)
  ↓
PostgreSQL
```

### Start

```powershell
docker-compose -f docker-compose.yml -f docker-compose.level2.yml --profile cache up -d
```

Environment changes applied automatically:

```env
CACHE_ENABLED=true
REDIS_URL=redis://redis:6379
```

### Free/Cheap Redis Hosting

| Provider | Free Tier | Paid |
|----------|-----------|------|
| **Upstash** | 10,000 req/day, 256 MB | $0.2/100K req |
| **Redis Cloud** | 30 MB free | From $7/month |
| **Railway** | Included in plan | Part of usage |
| **Render** | $10/month Redis | From $10/month |

**Recommended:** Upstash for serverless (pay-per-use, generous free tier)

```env
# Upstash config in docker.env
REDIS_URL=rediss://default:your-token@your-endpoint.upstash.io:6379
```

### What Gets Cached

- Service categories (TTL: 1 hour)
- Provider profiles (TTL: 5 minutes)
- Popular service listings (TTL: 2 minutes)
- Token blacklist entries (TTL: token lifetime)

---

## Level 3 — Worker Layer

**Target:** 2,000–10,000 concurrent users  
**Monthly cost: ~$20–$80**  
**Add:** BullMQ background workers

### Infrastructure

```
Browser
  ↓
Frontend — Vercel
  ↓
API Gateway
  ↓
6 Microservices ──→ Redis Queue ──→ BullMQ Workers
  ↓
PostgreSQL
```

### Start

```powershell
docker-compose -f docker-compose.yml -f docker-compose.level3.yml --profile workers up -d
```

Environment changes applied automatically:

```env
CACHE_ENABLED=true
WORKERS_ENABLED=true
WORKER_CONCURRENCY=10
```

### Hosting Setup at Level 3

Option A — **Same container, different role**  
Each service pod can run as either API-only or worker-only:

```env
# API pod (handles HTTP)
WORKERS_ENABLED=false

# Worker pod (handles queues)
WORKERS_ENABLED=true
PORT=0  # No HTTP listener needed
```

This lets you scale API pods and worker pods independently on Render/Railway.

Option B — **Render Background Workers** ($7/month per worker)
- New → Background Worker → point to service dir
- Set `WORKERS_ENABLED=true`, no port needed

### Workers Handle (non-blocking, retriable)

| Queue | Timeout | Retries |
|-------|---------|--------|
| email-queue | 60s | 3 |
| sms-queue | 30s | 3 |
| payment-retry | 120s | 5 |
| analytics | 30s | 1 |
| notification-delivery | 10s | 3 |
| rating-recalculation | 30s | 2 |

---

## Level 4 — Event-Driven

**Target:** 10,000–50,000 concurrent users  
**Monthly cost: ~$80–$300**  
**Add:** Kafka event streaming

### Infrastructure

```
Browser
  ↓
Frontend — Vercel / CDN
  ↓
Load Balancer (Nginx / Cloudflare)
  ↓
API Gateway (2+ replicas)
  ↓
Microservices ──→ Kafka ──→ Event Consumers
       ↓                ↓
  PostgreSQL       Redis Cache/Queue
```

### Start

```powershell
docker-compose -f docker-compose.yml -f docker-compose.level4.yml --profile events up -d
```

Environment changes applied automatically:

```env
CACHE_ENABLED=true
WORKERS_ENABLED=true
EVENT_BUS_ENABLED=true
KAFKA_BROKERS=kafka:29092
```

### Kafka Hosting Options

| Provider | Free Tier | Paid |
|----------|-----------|------|
| **Confluent Cloud** | 30-day trial | From $15/month |
| **Upstash Kafka** | 10,000 msg/day | From $0.6/GB |
| **Aiven** | 30-day trial | From $20/month |
| **Self-hosted** | Your server cost | EC2 t3.small ~$15/month |

**Recommended:** Upstash Kafka (serverless, pay-per-use, works from day 1)

```env
# Upstash Kafka config
KAFKA_BROKERS=your-endpoint.upstash.io:9092
KAFKA_SASL_USERNAME=your-username
KAFKA_SASL_PASSWORD=your-password
EVENT_BUS_ENABLED=true
```

### Events Published

| Event | Producer | Consumers |
|-------|----------|-----------|
| `request.created` | marketplace-service | comms-service |
| `proposal.accepted` | marketplace-service | comms-service, payment-service |
| `job.completed` | marketplace-service | payment-service, comms-service |
| `payment.completed` | payment-service | marketplace-service, comms-service |
| `review.submitted` | marketplace-service | oversight-service |

---

## Level 5 — Full Scale

**Target:** 50,000+ concurrent users  
**Monthly cost: $300+**  
**Add:** Kubernetes, DB replicas, CDN, full observability

### Infrastructure

```
Browser
  ↓
Cloudflare CDN + WAF
  ↓
Vercel (frontend — global edge)
  ↓
AWS ALB / GCP Load Balancer
  ↓
Kubernetes Cluster
  ├── api-gateway (3+ pods, HPA)
  ├── identity-service (2+ pods)
  ├── marketplace-service (3+ pods)
  ├── payment-service (2+ pods)
  ├── comms-service API (2+ pods)
  ├── comms-service workers (3+ pods)
  ├── oversight-service (1+ pods)
  └── infrastructure-service (1+ pods)
       ↓               ↓              ↓
  PostgreSQL       Redis Cluster    Kafka Cluster
  (primary +       (3 nodes,        (3 brokers,
   read replicas)   HA mode)         Zookeeper)
```

### Start

```powershell
docker-compose -f docker-compose.yml -f docker-compose.level5.yml --profile full up -d
```

Environment changes:

```env
CACHE_ENABLED=true
WORKERS_ENABLED=true
EVENT_BUS_ENABLED=true
REDIS_RATE_LIMIT_ENABLED=true
DEVICE_TRACKING_ENABLED=true
WORKER_CONCURRENCY=20
DB_POOL_MAX=30
```

### Kubernetes Setup (AWS EKS)

```bash
# 1. Create EKS cluster
ekctl create cluster --name marketplace --region us-east-1 --nodegroup-name standard-workers --node-type t3.medium --nodes 3

# 2. Deploy each service
kubectl apply -f k8s/identity-service.yaml
kubectl apply -f k8s/marketplace-service.yaml
# ... repeat for each service

# 3. Set up HPA (auto-scaling)
kubectl autoscale deployment api-gateway --cpu-percent=70 --min=2 --max=10
```

### Managed Services (Recommended for Level 5)

| Component | AWS | GCP | Free Alt |
|-----------|-----|-----|----------|
| PostgreSQL | RDS ($50+/mo) | Cloud SQL ($40+/mo) | Neon Scale ($19/mo) |
| Redis | ElastiCache ($25+/mo) | Memorystore ($30+/mo) | Upstash Pro |
| Kafka | MSK ($150+/mo) | Pub/Sub ($20+) | Upstash Kafka |
| Container Registry | ECR ($0.1/GB) | GCR ($0.1/GB) | GitHub Packages |
| K8s | EKS ($70/mo) | GKE ($75/mo) | DigitalOcean K8s ($48/mo) |

### CDN Setup

```env
# Cloudflare — free tier covers most use cases
# 1. Add domain to Cloudflare
# 2. Enable proxy (orange cloud) for API Gateway
# 3. Set cache rules:
#    - GET /categories/* → cache 1 hour
#    - GET /providers/* → cache 5 min
#    - POST/PATCH/DELETE → bypass cache
```

---

## Cost Comparison by User Volume

| Monthly Users | Level | Estimated Cost | Stack |
|--------------|-------|----------------|-------|
| 0–1,000 | 1 | **$0** | Vercel + Render free + Neon free |
| 1,000–5,000 | 2 | **$10–$30** | + Upstash Redis ($5) |
| 5,000–20,000 | 3 | **$30–$80** | + Render worker pods ($7/each) |
| 20,000–100,000 | 4 | **$80–$300** | + Upstash Kafka ($20) + bigger DB |
| 100,000+ | 5 | **$300+** | Kubernetes + managed services |

---

## Recommended Free Hosting Stack (Level 1–2)

This is the easiest zero-cost setup to launch:

```
Frontend     → Vercel (free — unlimited bandwidth on hobby plan)
API Gateway  → Render free web service
6 Services   → Render free web services (6 × free)
PostgreSQL   → Neon free tier (0.5 GB, serverless)
Redis        → Upstash free (10K req/day, 256 MB)
Email        → Brevo (formerly Sendinblue) free: 300 emails/day
SMS          → Twilio trial credit ($15 free)
File storage → Cloudinary free tier (25 GB)
```

### Setup Steps

1. **Generate secrets:**
   ```powershell
   .\scripts\setup-env-files.ps1
   # Edit docker.env with generated JWT_SECRET, etc.
   ```

2. **Database — Neon:**
   - Sign up at https://neon.tech
   - Create project → copy pooled `DATABASE_URL`
   - Run schema: paste content of `database/schema.sql` in Neon console

3. **Services — Render:**
   - Connect GitHub repo
   - For each service, set:
     - Root directory: `services/<service-name>`
     - Build: `pnpm install && pnpm build`
     - Start: `node dist/main`
     - Environment: paste variables from `docker.env`

4. **Frontend — Vercel:**
   - Import repo → set root to `frontend/`
   - Set `NEXT_PUBLIC_API_URL` to your Render gateway URL
   - Set `AUTH_SECRET` to a 32-char random string

5. **Seed data:**
   ```powershell
   # Temporarily set DATABASE_URL to your Neon URL in database/.env
   cd database; node seed.js
   ```

---

## Troubleshooting

**Redis not connecting after enabling Level 2:**
```powershell
docker-compose logs redis
# Ensure REDIS_URL is set correctly in service env
docker-compose exec comms-service env | grep REDIS
```

**Workers not processing jobs:**
```powershell
docker-compose logs comms-service
# Check WORKERS_ENABLED=true is in the running container
docker-compose exec comms-service env | grep WORKERS
```

**Kafka consumers not receiving events:**
```powershell
docker-compose logs kafka
# Allow 30-60s for Kafka to fully start before services connect
# Check EVENT_BUS_ENABLED=true in service env
```

**Services sleeping on Render free tier:**
- Free tier services sleep after 15 min idle and take ~30s to wake
- Fix: use Render's "Cron Job" to ping `/health` every 10 min
- Or upgrade to Render Starter ($7/month per service) for always-on

**Database too slow at Level 1:**
- Add indexes: `CREATE INDEX CONCURRENTLY idx_... ON ...;`
- Use `EXPLAIN ANALYZE` in Neon console to find slow queries
- Upgrade Neon plan (Launch: $19/month — 10 GB, better compute)


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
