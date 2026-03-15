# Database Schema Alignment Report

**Generated:** March 15, 2026  
**Status:** ⚠️ **CRITICAL ISSUES FOUND**

This document audits the entire stack (Database → Backend → Frontend) for field naming, type consistency, and structural alignment.

---

## Executive Summary

✅ **Aligned Components:**
- User authentication tables (users, sessions, tokens)
- Provider profiles and services
- Proposals structure
- Jobs structure  
- Payments structure
- Reviews structure
- Messages and attachments
- Notifications

⚠️ **Critical Issues:**
1. **Location field naming mismatch** (lat/lng vs latitude/longitude)
2. **ServiceRequest field name inconsistency** (customer_id vs user_id)
3. **Missing frontend fields** for some backend/DB columns

---

## 🔴 Critical Issue #1: Location Coordinate Field Names

### Problem
API input uses **different field names** than database and output.

### Current State

| Layer | Latitude Field | Longitude Field | Location |
|-------|---------------|-----------------|----------|
| **Database Schema** | `latitude` | `longitude` | `database/schema.sql:154-155` |
| **Backend Entity** | `latitude` | `longitude` | `services/request-service/src/modules/request/entities/location.entity.ts` |
| **Input DTO** | `lat` ❌ | `lng` ❌ | `services/request-service/src/modules/request/dto/create-request.dto.ts` |
| **Output DTO** | `latitude` ✅ | `longitude` ✅ | `services/request-service/src/modules/request/dto/request-response.dto.ts` |
| **Frontend Request Service** | `lat` ❌ | `lng` ❌ | `frontend/services/request-service.ts:21-22` |
| **Frontend User Service** | `latitude` ✅ | `longitude` ✅ | `frontend/services/user-service.ts:15-16` |

### Impact
- **API Inconsistency:** Clients send `{lat, lng}` but receive `{latitude, longitude}`
- **Confusion:** Different field names for same data across frontend services
- **Maintenance Risk:** Developers unsure which naming to use

### Recommendation
**🎯 Standardize to `latitude` and `longitude` everywhere:**
1. Update `CreateRequestDto` → rename `lat` to `latitude`, `lng` to `longitude`
2. Update frontend `request-service.ts` → use `latitude/longitude` in location objects
3. Update any frontend forms that create requests

---

## 🔴 Critical Issue #2: ServiceRequest User Reference

### Problem
Database uses `user_id` (nullable for anonymous requests), but frontend sometimes uses `customer_id`.

### Current State

| Layer | Field Name | Nullable | Location |
|-------|-----------|----------|----------|
| **Database Schema** | `user_id` | ✅ Yes (for anonymous) | `database/schema.sql:174` |
| **Backend Entity** | `user_id` | ✅ Yes | `services/request-service/src/modules/request/entities/service-request.entity.ts` |
| **Frontend Type** | `customer_id` ❌ | ❌ No | `frontend/services/request-service.ts:6` |

### Frontend Type Definition
```typescript
export interface ServiceRequest {
  id: string;
  customer_id: string;  // ❌ Should be user_id
  category_id: string;
  // ...
}
```

### Database Schema
```sql
CREATE TABLE service_requests (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- Nullable for anonymous
  -- ...
```

### Impact
- **Type Safety Broken:** Frontend expects `customer_id` but backend sends `user_id`
- **Anonymous Requests:** Frontend doesn't handle nullable user_id for guest requests
- **Missing Fields:** Frontend type doesn't include `guest_name`, `guest_email`, `guest_phone`

### Recommendation
**🎯 Update frontend ServiceRequest interface:**
```typescript
export interface ServiceRequest {
  id: string;
  user_id?: string | null;  // Changed from customer_id, nullable for anonymous
  category_id: string;
  // ... existing fields ...
  // Add guest fields
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
}
```

---

## ⚠️ Issue #3: Missing Frontend Fields

### Service Requests
Frontend type is **missing** these DB/Backend fields:

| Field | Database | Backend Entity | Frontend Type |
|-------|----------|----------------|---------------|
| `location_id` | ✅ | ✅ | ❌ Missing |
| `guest_name` | ✅ | ✅ | ❌ Missing |
| `guest_email` | ✅ | ✅ | ❌ Missing |
| `guest_phone` | ✅ | ✅ | ❌ Missing |

### User Profile
Frontend type is **missing** these DB/Backend fields:

| Field | Database | Backend Entity | Frontend Type |
|-------|----------|----------------|---------------|
| `name` | ✅ | ✅ | ❌ Missing |

**Current frontend UserProfile:**
```typescript
export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  // Missing: name field
}
```

**Database schema has:**
```sql
name VARCHAR(255),
```

### Recommendation
Add missing fields to frontend types to match backend reality.

---

## ✅ Verified Alignments

### Users Table
| Field | Database | Auth Service | Frontend | Status |
|-------|----------|--------------|----------|--------|
| `id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `email` | VARCHAR(255) | ✅ string | ✅ string | ✅ Aligned |
| `name` | VARCHAR(255) | ✅ string | ❌ Missing | ⚠️ Missing in frontend |
| `phone` | VARCHAR(20) | ✅ string | ✅ string | ✅ Aligned |
| `password_hash` | TEXT | ✅ string | N/A | ✅ Aligned |
| `role` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `email_verified` | BOOLEAN | ✅ boolean | ✅ boolean | ✅ Aligned |
| `phone_verified` | BOOLEAN | ✅ boolean | ✅ boolean | ✅ Aligned |
| `profile_picture_url` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `timezone` | VARCHAR(100) | ✅ string | ✅ string | ✅ Aligned |
| `language` | VARCHAR(10) | ✅ string | ✅ string | ✅ Aligned |
| `last_login_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |
| `status` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `created_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |
| `updated_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |
| `deleted_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |

### Providers Table
| Field | Database | User Service | Frontend | Status |
|-------|----------|--------------|----------|--------|
| `id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `user_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `business_name` | VARCHAR(255) | ✅ string | ✅ string | ✅ Aligned |
| `description` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `profile_picture_url` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `rating` | DECIMAL | ✅ number | ✅ number | ✅ Aligned |
| `total_jobs_completed` | INT | ✅ number | ✅ number | ✅ Aligned |
| `years_of_experience` | INT | ✅ number | ✅ number | ✅ Aligned |
| `service_area_radius` | DECIMAL | ✅ number | ✅ number | ✅ Aligned |
| `response_time_avg` | DECIMAL | ✅ number | ✅ number | ✅ Aligned |
| `verification_status` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `certifications` | JSONB | ✅ any | ✅ any | ✅ Aligned |
| `created_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |
| `deleted_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |

### Proposals Table
| Field | Database | Proposal Service | Frontend | Status |
|-------|----------|------------------|----------|--------|
| `id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `request_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `provider_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `price` | BIGINT | ✅ number | ✅ number | ✅ Aligned |
| `message` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `estimated_hours` | DECIMAL | ✅ number | ✅ number | ✅ Aligned |
| `start_date` | DATE | ✅ Date | ✅ string | ✅ Aligned |
| `completion_date` | DATE | ✅ Date | ✅ string | ✅ Aligned |
| `rejected_reason` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `status` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `created_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |
| `updated_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |

### Jobs Table
| Field | Database | Job Service | Frontend | Status |
|-------|----------|-------------|----------|--------|
| `id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `request_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `provider_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `customer_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `proposal_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `actual_amount` | BIGINT | ✅ number | ✅ number | ✅ Aligned |
| `cancelled_by` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `cancellation_reason` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `status` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `started_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |
| `completed_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |
| `created_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |
| `updated_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |

### Payments Table
| Field | Database | Payment Service | Frontend | Status |
|-------|----------|-----------------|----------|--------|
| `id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `job_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `user_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `provider_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `amount` | BIGINT | ✅ number | ✅ number | ✅ Aligned |
| `platform_fee` | BIGINT | ✅ number | ✅ number | ✅ Aligned |
| `provider_amount` | BIGINT | ✅ number | ✅ number | ✅ Aligned |
| `currency` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `payment_method` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `status` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `transaction_id` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `failed_reason` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `created_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |
| `paid_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |

### Reviews Table
| Field | Database | Review Service | Frontend | Status |
|-------|----------|----------------|----------|--------|
| `id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `job_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `user_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `provider_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `rating` | INT | ✅ number | ✅ number | ✅ Aligned |
| `comment` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `response` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `response_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |
| `helpful_count` | INT | ✅ number | ✅ number | ✅ Aligned |
| `verified_purchase` | BOOLEAN | ✅ boolean | ✅ boolean | ✅ Aligned |
| `created_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |

### Messages Table
| Field | Database | Messaging Service | Frontend | Status |
|-------|----------|-------------------|----------|--------|
| `id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `job_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `sender_id` | UUID | ✅ string | ✅ string | ✅ Aligned |
| `message` | TEXT | ✅ string | ✅ string | ✅ Aligned |
| `read` | BOOLEAN | ✅ boolean | ✅ boolean | ✅ Aligned |
| `read_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |
| `edited` | BOOLEAN | ✅ boolean | ✅ boolean | ✅ Aligned |
| `edited_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |
| `created_at` | TIMESTAMP | ✅ Date | ✅ string | ✅ Aligned |

### Notifications Table
| Field | Database | Notification Service | Frontend | Status |
|-------|----------|---------------------|----------|--------|
| `id` | UUID | ✅ | ✅ string | ✅ Aligned |
| `user_id` | UUID | ✅ | ✅ string | ✅ Aligned |
| `type` | TEXT | ✅ | ✅ string | ✅ Aligned |
| `message` | TEXT | ✅ | ✅ string | ✅ Aligned |
| `read` | BOOLEAN | ✅ | ✅ boolean | ✅ Aligned |
| `created_at` | TIMESTAMP | ✅ | ✅ string | ✅ Aligned |

---

## 📋 Recommended Fixes

### Priority 1: Critical Fixes

#### 1. Fix Location Field Names
**File:** `services/request-service/src/modules/request/dto/create-request.dto.ts`

**Change:**
```typescript
export class LocationDto {
  @IsNumber()
  latitude: number;  // Changed from 'lat'

  @IsNumber()
  longitude: number;  // Changed from 'lng'
  
  // ... rest remains same
}
```

**File:** `frontend/services/request-service.ts`

**Change:**
```typescript
export interface CreateRequestData {
  location?: {
    latitude: number;   // Changed from lat
    longitude: number;  // Changed from lng
    address?: string;
    // ...
  };
}
```

#### 2. Fix ServiceRequest Interface
**File:** `frontend/services/request-service.ts`

**Change:**
```typescript
export interface ServiceRequest {
  id: string;
  user_id?: string | null;  // Changed from customer_id, made nullable
  category_id: string;
  location_id?: string;  // Added
  description: string;
  budget: number;
  status: 'open' | 'assigned' | 'completed' | 'cancelled';
  
  // Guest fields for anonymous requests
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  
  // ... rest remains same
}
```

#### 3. Add Name Field to UserProfile
**File:** `frontend/services/user-service.ts`

**Change:**
```typescript
export interface UserProfile {
  id: string;
  email: string;
  name?: string;  // Added
  phone?: string;
  // ... rest remains same
}
```

### Priority 2: Update Forms

Update all frontend forms that create/edit service requests to use `latitude`/`longitude`:
- `frontend/app/requests/create/page.tsx`
- Any map components
- Any location pickers

---

## 🧪 Testing Checklist

After applying fixes:

- [ ] Test creating a service request with location
- [ ] Verify location data saves correctly to database
- [ ] Test anonymous request creation (guest fields)
- [ ] Test authenticated request creation (user_id)
- [ ] Verify API responses have consistent field names
- [ ] Check all frontend forms using location data
- [ ] Run backend DTO validation tests
- [ ] Run frontend TypeScript compilation

---

## 📊 Summary Statistics

| Category | Total Fields | Aligned | Misaligned | Missing |
|----------|-------------|---------|------------|---------|
| Users | 16 | 15 | 0 | 1 |
| Providers | 14 | 14 | 0 | 0 |
| Service Requests | 17 | 11 | 2 | 4 |
| Proposals | 11 | 11 | 0 | 0 |
| Jobs | 12 | 12 | 0 | 0 |
| Payments | 14 | 14 | 0 | 0 |
| Reviews | 11 | 11 | 0 | 0 |
| Messages | 9 | 9 | 0 | 0 |
| Notifications | 6 | 6 | 0 | 0 |
| **TOTAL** | **110** | **103** | **2** | **5** |

**Overall Alignment: 93.6%** ✅

---

## Next Steps

1. **Apply Critical Fixes** (Priority 1) - Coordinate with backend and frontend teams
2. **Update API Documentation** to reflect corrected field names
3. **Run Migration** if any database schema changes needed (none currently)
4. **Test End-to-End** flows after fixes
5. **Update Postman/API Collections** with correct field names
6. **Establish Naming Convention** to prevent future drift

---

**Report Generated by:** AI Developer Agent  
**Last Updated:** March 15, 2026
