# Database Migrations

## Overview

This directory contains incremental database migration scripts. These migrations were created during development to upgrade existing databases.

## Current Status: ✅ ALL MIGRATIONS INTEGRATED

**As of March 28, 2026**, all migration scripts in this directory have been **fully integrated** into the main `database/schema.sql` file.

### Integrated Migrations

| File | Description | Status |
|------|-------------|--------|
| `001_add_user_name.sql` | Add name column to users table | ✅ Integrated into schema.sql |
| `002_production_readiness_fixes.sql` | Production readiness improvements (47 fixes) | ✅ Integrated into schema.sql |
| `006_create_unsubscribe_table.sql` | Create unsubscribes table for email preferences | ✅ Integrated into schema.sql |
| `014_list_query_performance_indexes.sql` | Composite indexes for request/proposal/job list APIs | ✅ Integrated into schema.sql |

## For New Deployments

**Use `database/schema.sql` directly** — it contains all tables, indexes, constraints, triggers, and utility functions needed for production.

```bash
# Fresh database setup
psql -U postgres -d marketplace -f database/schema.sql
```

## For Existing Databases

If you have an **existing database** created from an older schema version, you can:

1. **Option 1 (Recommended)**: Export data, drop database, recreate with new schema, import data
   ```bash
   pg_dump -U postgres marketplace > backup.sql
   dropdb -U postgres marketplace
   createdb -U postgres marketplace
   psql -U postgres -d marketplace -f database/schema.sql
   psql -U postgres -d marketplace -f backup.sql  # Restore data only
   ```

2. **Option 2**: Apply migrations incrementally
   ```bash
   psql -U postgres -d marketplace -f database/migrations/001_add_user_name.sql
   psql -U postgres -d marketplace -f database/migrations/002_production_readiness_fixes.sql
   psql -U postgres -d marketplace -f database/migrations/006_create_unsubscribe_table.sql
   ```

## Migration History

### 001_add_user_name.sql
- **Date**: March 14, 2026
- **Purpose**: Add `name` column to `users` table
- **Impact**: Allows storing user's full name separately from email
- **Changes**:
  - Added `name TEXT` column to users table
  - Updated existing users with default name from email

### 002_production_readiness_fixes.sql
- **Date**: March 14, 2026
- **Purpose**: Apply 47 critical production-readiness improvements
- **Impact**: Database goes from 65% → 90% production ready
- **Changes**:
  - 15 NOT NULL constraints added
  - 11 CHECK constraints for data validation
  - 40+ indexes for query performance
  - 20+ cascading delete rules
  - Auto-update triggers for timestamps
  - UNIQUE constraints to prevent duplicates

### 006_create_unsubscribe_table.sql
- **Date**: March 14, 2026
- **Purpose**: Create unsubscribe tracking table
- **Impact**: Enables compliance with email unsubscribe requirements
- **Changes**:
  - Created `unsubscribes` table
  - Added indexes for fast lookups
  - Supports both user-based and email-based unsubscribes

### 014_list_query_performance_indexes.sql
- **Date**: March 28, 2026
- **Purpose**: Optimize new list filtering, sorting, and pagination queries
- **Impact**: Reduces scan cost for request, proposal, and job list APIs after adding richer backend filters
- **Changes**:
  - Added composite indexes for service request status/category/urgency + created_at queries
  - Added proposal indexes for request/provider/status + created_at queries
  - Added job indexes for provider/customer/status + started_at and completed_at queries
  - Refreshed planner statistics with `ANALYZE`

## Notes

- These migration files are **retained for reference** and documentation purposes
- They show the evolution of the database schema
- They can be used to migrate existing databases
- For new deployments, ignore these files and use `database/schema.sql`

## Production Checklist

Before deploying to production:

- [x] All migrations integrated into schema.sql
- [x] Schema includes all constraints and indexes
- [x] Auto-update triggers configured
- [x] Materialized views created
- [x] Full-text search configured
- [x] Utility functions added
- [x] Database comments/documentation added

## Support

For questions about database setup or migrations, refer to:
- `docs/DATABASE_PRODUCTION_READINESS_AUDIT.md` - Detailed analysis
- `docs/MIGRATION_GUIDE.md` - Step-by-step migration instructions
- `database/schema.sql` - Complete production schema
