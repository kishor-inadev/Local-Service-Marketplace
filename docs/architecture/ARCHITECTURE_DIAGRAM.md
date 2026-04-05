# Service Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                           │
│                      http://localhost:3000                          │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     API GATEWAY (NestJS)                            │
│                      http://localhost:3000                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Middleware Chain:                                           │  │
│  │  1. Logging → 2. JWT Auth → 3. Rate Limiting                │  │
│  │                                                              │  │
│  │  Routes:                                                     │  │
│  │  - /auth/*        → identity-service:3001                   │  │
│  │  - /users/*       → identity-service:3001                   │  │
│  │  - /providers/*   → identity-service:3001                   │  │
│  │  - /requests/*    → marketplace-service:3003                │  │
│  │  - /proposals/*   → marketplace-service:3003                │  │
│  │  - /jobs/*        → marketplace-service:3003                │  │
│  │  - /payments/*    → payment-service:3006                    │  │
│  │  - /messages/*    → comms-service:3007                      │  │
│  │  - /notifications/* → comms-service:3007                    │  │
│  │  - /reviews/*     → marketplace-service:3003                │  │
│  │  - /admin/*       → oversight-service:3010                  │  │
│  │  - /analytics/*   → oversight-service:3010                  │  │
│  │  - /events/*      → infrastructure-service:3012             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CORE SERVICES                                │
│                     (Always Required)                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │Identity Svc  │  │Marketplace   │  │Payment Svc   │            │
│  │   :3001      │  │   :3003      │  │   :3006      │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                  │                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │Comms Svc     │  │Oversight Svc │  │Infra Svc     │            │
│  │   :3007      │  │   :3010      │  │   :3012      │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                  │                     │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL :5432                               │
│                   (Primary Database)                                │
│                                                                     │
│  Tables: 45+ tables across all services                            │
│  - users, providers, service_requests, proposals, jobs             │
│  - payments, reviews, messages, notifications, etc.                │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      OPTIONAL SERVICES                              │
│              (Can be disabled via feature flags)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────┐        ┌───────────────────┐               │
│  │  Comms Service    │◄───────┤  WebSocket Chat   │               │
│  │      :3007        │        │  (Socket.IO)      │               │
│  └────────┬──────────┘        └───────────────────┘               │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────────────────────────────────────┐             │
│  │        Comms Service :3007                       │             │
│  │  ┌────────────────────────────────────────────┐  │             │
│  │  │ Feature Flags:                             │  │             │
│  │  │ - EMAIL_ENABLED (default: true)            │  │             │
│  │  │ - SMS_ENABLED (default: false)             │  │             │
│  │  └────────────────────────────────────────────┘  │             │
│  └───────────────┬───────────────┬──────────────────┘             │
│                  │               │                                 │
│                  ▼               ▼                                 │
│  ┌───────────────────┐   ┌───────────────────┐                   │
│  │  Email Service    │   │   SMS Service     │                   │
│  │    :4000→3500     │   │    :5000→3000     │                   │
│  └────────┬──────────┘   └────────┬──────────┘                   │
│           │                       │                                │
│           ▼                       ▼                                │
│  ┌───────────────────┐   ┌───────────────────┐                   │
│  │  MongoDB          │   │  MongoDB          │                   │
│  │  :27018           │   │  :27019           │                   │
│  │  (email logs)     │   │  (sms logs)       │                   │
│  └───────────────────┘   └───────────────────┘                   │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE SERVICES                           │
│           (Optional - Enable based on scaling level)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────┐                      │
│  │ Infrastructure Service :3012             │                      │
│  │ - Background Jobs                        │                      │
│  │ - Feature Flags                          │                      │
│  │ - Rate Limits                            │                      │
│  │ - Events Management                      │                      │
│  └──────────┬───────────────────────────────┘                      │
│             │                                                       │
│             ▼                                                       │
│  ┌─────────────────────┐      ┌─────────────────────┐            │
│  │   Redis :6379       │      │  Kafka :9092        │            │
│  │   ┌──────────────┐  │      │  ┌──────────────┐   │            │
│  │   │CACHE_ENABLED │  │      │  │EVENT_BUS     │   │            │
│  │   │  (default:   │  │      │  │_ENABLED      │   │            │
│  │   │   false)     │  │      │  │ (default:    │   │            │
│  │   └──────────────┘  │      │  │   false)     │   │            │
│  │                     │      │  └──────────────┘   │            │
│  │  Uses:              │      │                     │            │
│  │  - Caching          │      │  Uses:              │            │
│  │  - Job Queues       │      │  - Event Streaming  │            │
│  │  - Rate Limiting    │      │  - Analytics        │            │
│  │  - Sessions         │      │  - Audit Logs       │            │
│  └─────────────────────┘      └─────────────────────┘            │
│                                                                   │
│  Profile: --profile cache     Profile: --profile events          │
└───────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      FEATURE FLAG SYSTEM                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Core Features (Always Work):                                      │
│  ✅ User Registration                                              │
│  ✅ Provider Browsing                                              │
│  ✅ Service Requests                                               │
│  ✅ Proposals & Jobs                                               │
│  ✅ Payments                                                       │
│  ✅ Reviews                                                        │
│                                                                     │
│  Optional Features (Controlled by flags):                          │
│  🎛️  EMAIL_ENABLED=true/false                                     │
│      └─> Controls: Email notifications across all services        │
│      └─> Impact: No emails sent when false                        │
│      └─> Fallback: Core features work without notifications       │
│                                                                     │
│  🎛️  SMS_ENABLED=true/false                                       │
│      └─> Controls: SMS/OTP functionality                          │
│      └─> Impact: Phone login unavailable when false               │
│      └─> Fallback: Email/password login available                 │
│                                                                     │
│  🎛️  CACHE_ENABLED=true/false                                     │
│      └─> Controls: Redis caching layer                            │
│      └─> Impact: Slower queries when false                        │
│      └─> Fallback: Direct database queries                        │
│                                                                     │
│  🎛️  EVENT_BUS_ENABLED=true/false                                 │
│      └─> Controls: Kafka event streaming                          │
│      └─> Impact: No analytics events when false                   │
│      └─> Fallback: Events not published                           │
│                                                                     │
│  🎛️  WORKERS_ENABLED=true/false                                   │
│      └─> Controls: Background job processing                      │
│      └─> Impact: Synchronous processing when false                │
│      └─> Fallback: Immediate processing (slightly slower)         │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      DEPLOYMENT MODES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Mode 1: MINIMAL (Development/MVP)                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Services: PostgreSQL + Core Services                         │  │
│  │ Flags: All disabled                                          │  │
│  │ Users: <100                                                  │  │
│  │ Features: Core only (no notifications, no chat)              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Mode 2: STANDARD (Production)                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Services: PostgreSQL + Core + Notification + Email          │  │
│  │ Flags: EMAIL_ENABLED=true                                   │  │
│  │ Users: 100-1K                                                │  │
│  │ Features: Core + Email notifications                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Mode 3: OPTIMIZED (Growing)                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Services: Standard + Redis                                   │  │
│  │ Flags: EMAIL_ENABLED=true, CACHE_ENABLED=true               │  │
│  │ Users: 1K-10K                                                │  │
│  │ Features: Core + Notifications + Cache + Workers             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Mode 4: ENTERPRISE (High Scale)                                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Services: All services + Redis + Kafka                      │  │
│  │ Flags: All enabled                                           │  │
│  │ Users: 10K+                                                  │  │
│  │ Features: Full stack with real-time events                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Legend

```
┌─────┐
│ Box │  = Service/Component
└─────┘

   │
   ▼     = Data/Request Flow

:3001    = Port Number

✅       = Always enabled
🎛️       = Configurable via flag
```

## Service Dependencies

**Hard Dependencies (Required):**
- All services → PostgreSQL
- API Gateway → All backend services
- Email Service → MongoDB (email logs)
- SMS Service → MongoDB (sms logs)

**Soft Dependencies (Optional):**
- All services → Redis (if CACHE_ENABLED=true)
- All services → Kafka (if EVENT_BUS_ENABLED=true)
- Notification Service → Email Service (if EMAIL_ENABLED=true)
- Notification Service → SMS Service (if SMS_ENABLED=true)
- Core Services → Notification Service (non-blocking)

## Ports Summary

| Service | Internal | External | Protocol |
|---------|----------|----------|----------|
| API Gateway | 3000 | 3000 | HTTP |
| Auth Service | 3001 | 3001 | HTTP |
| User Service | 3002 | 3002 | HTTP |
| Request Service | 3003 | 3003 | HTTP |
| Proposal Service | 3004 | 3004 | HTTP |
| Job Service | 3005 | 3005 | HTTP |
| Payment Service | 3006 | 3006 | HTTP |
| Messaging Service | 3007 | 3007 | HTTP + WebSocket |
| Notification Service | 3008 | 3008 | HTTP |
| Review Service | 3009 | 3009 | HTTP |
| Admin Service | 3010 | 3010 | HTTP |
| Analytics Service | 3011 | 3011 | HTTP |
| Infrastructure Service | 3012 | 3012 | HTTP |
| Email Service | 3500 | 4000 | HTTP |
| SMS Service | 3000 | 5000 | HTTP |
| PostgreSQL | 5432 | 5432 | TCP |
| Redis | 6379 | 6379 | TCP |
| Kafka | 9092 | 9092 | TCP |
| MongoDB (Email) | 27017 | 27018 | TCP |
| MongoDB (SMS) | 27017 | 27019 | TCP |
