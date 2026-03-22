# 🌱 Database Seeding Guide

## Quick Start

**Run this command from the root directory:**

```powershell
.\scripts\seed-database.ps1
```

This will populate your database with **1000+ sample records** across all tables.

---

## What You'll Get

### 📊 Complete Sample Dataset

- ✅ **151 Users** - 100 customers, 50 providers, 1 admin
- ✅ **15 Service Categories** - Plumbing, Electrical, Carpentry, etc.
- ✅ **50 Provider Profiles** - Complete with portfolios, documents, availability
- ✅ **120 Service Requests** - Mix of open, assigned, completed, cancelled
- ✅ **200 Proposals** - Provider bids on service requests
- ✅ **80 Jobs** - With full lifecycle (scheduled → in progress → completed)
- ✅ **Payments, Reviews, Messages** - Complete transaction history
- ✅ **Notifications, Favorites, Coupons** - All features populated
- ✅ **Daily Metrics** - Analytics data from Jan 2024 to today

### 🔑 Default Login Credentials

**Admin Account:**
```
Email: admin@marketplace.com
Password: password123
```

**All Other Users:**
```
Password: password123
```
All user emails follow realistic patterns (e.g., `john.smith@gmail.com`)

---

## Prerequisites

Before running the seeder:

### 1. **Database Must Be Running**

```powershell
# Start Docker containers
docker-compose up -d postgres-db
```

### 2. **Schema Must Be Applied**

```powershell
# Apply database schema
docker exec -i postgres-db psql -U postgres -d marketplace < database/schema.sql
```

### 3. **Environment Variables Set**

Ensure your `.env` file has database configuration:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=marketplace
```

---

## Running the Seeder

### Option 1: Interactive Script (Recommended)

```powershell
.\scripts\seed-database.ps1
```

This will:
1. ✅ Load environment variables
2. ✅ Verify database connection
3. ✅ Install dependencies if needed
4. ✅ Prompt for confirmation
5. ✅ Run the seeder
6. ✅ Display summary and credentials

### Option 2: Manual Execution

```bash
cd database
pnpm install
pnpm run seed
```

---

## What Gets Created

### Core Tables (50+ records each)

| Table | Records | Description |
|-------|---------|-------------|
| `users` | 151 | Customers, providers, admins |
| `providers` | 50 | Provider business profiles |
| `service_categories` | 15 | Service types |
| `service_requests` | 120+ | Customer service requests |
| `proposals` | 200+ | Provider bids |
| `jobs` | 80+ | Active/completed jobs |
| `payments` | 80+ | Payment transactions |
| `reviews` | 60+ | Provider ratings |
| `messages` | 400+ | Job conversations |
| `notifications` | 300+ | User notifications |
| `locations` | 150+ | Geographic data |
| `sessions` | 100+ | Active user sessions |
| `login_attempts` | 200+ | Auth history |
| `coupons` | 50+ | Discount codes |
| `contact_messages` | 80+ | Support inquiries |
| `daily_metrics` | 70+ | Analytics data |

**Plus many more supporting tables!**

---

## Data Characteristics

### ✨ Realistic & Varied

- **Geographic Distribution**: 10 major US cities
- **Time Spread**: Data from Jan 2024 to present
- **Status Variety**: Open, completed, cancelled items
- **Role Diversity**: Customers, providers, admins
- **Business Logic**: Proper fees, ratings, relationships

### 🔗 Proper Relationships

- Jobs linked to requests, proposals, customers, providers
- Payments linked to jobs with calculated platform fees
- Reviews linked to completed jobs only
- Messages threaded by job
- Notifications delivered via multiple channels

### 📈 Frontend-Ready

All data is designed to make your frontend look **fully functional**:

- ✅ Populated dashboards with real metrics
- ✅ Service listings with images and descriptions
- ✅ User profiles with avatars and details
- ✅ Message threads with conversations
- ✅ Review sections with ratings and comments
- ✅ Payment history with transaction details

---

## After Seeding

### 1. **Verify Data**

```sql
-- Connect to database
docker exec -it postgres-db psql -U postgres -d marketplace

-- Check record counts
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'providers', COUNT(*) FROM providers
UNION ALL
SELECT 'service_requests', COUNT(*) FROM service_requests
UNION ALL
SELECT 'jobs', COUNT(*) FROM jobs;
```

### 2. **Start Your Application**

```powershell
# Start all services
.\scripts\start.ps1

# Or start MVP services only
.\scripts\start-mvp.ps1
```

### 3. **Login and Explore**

Visit `http://localhost:3000` and login:
- Admin: `admin@marketplace.com` / `password123`
- Or any user email with password `password123`

---

## Troubleshooting

### ❌ "Database connection failed"

**Problem:** Cannot connect to PostgreSQL

**Solution:**
```powershell
# Check if PostgreSQL is running
docker ps | findstr postgres

# Start if not running
docker-compose up -d postgres-db

# Verify connection
docker exec postgres-db pg_isready -U postgres
```

---

### ❌ "Table does not exist"

**Problem:** Schema not applied

**Solution:**
```powershell
# Apply schema
docker exec -i postgres-db psql -U postgres -d marketplace < database/schema.sql
```

---

### ❌ "Duplicate key violation"

**Problem:** Data already exists

**Solution:** Clear database first
```powershell
# Drop and recreate schema
docker exec -it postgres-db psql -U postgres -d marketplace -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Reapply schema
docker exec -i postgres-db psql -U postgres -d marketplace < database/schema.sql

# Run seeder again
.\scripts\seed-database.ps1
```

---

### ❌ "Dependencies not found"

**Problem:** npm packages not installed

**Solution:**
```powershell
cd database
pnpm install
cd ..
.\scripts\seed-database.ps1
```

---

## Customization

Want to customize the data? Edit `database/seed.ts`:

```typescript
// Change number of customers
for (let i = 0; i < 100; i++) { // <- Change this number

// Add more categories
const serviceCategories = [
  { name: 'Your New Category', description: '...', icon: '🔧' },
  // ...
];

// Adjust date ranges
randomDate(new Date(2024, 0, 1), new Date()) // <- Change dates
```

Then re-run:
```powershell
.\scripts\seed-database.ps1
```

---

## Clearing Data

To reset and re-seed:

```powershell
# Method 1: Drop and recreate
docker exec -it postgres-db psql -U postgres -d marketplace -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker exec -i postgres-db psql -U postgres -d marketplace < database/schema.sql
.\scripts\seed-database.ps1

# Method 2: Recreate entire database
docker-compose down -v
docker-compose up -d postgres-db
# Wait a few seconds
docker exec -i postgres-db psql -U postgres -d marketplace < database/schema.sql
.\scripts\seed-database.ps1
```

---

## Production Warning

⚠️ **NEVER run this seeder in production!**

This is **development/testing data only** with:
- Weak passwords (`password123`)
- Fake personal information
- Test payment data
- Mock certifications

---

## Performance

- **Execution Time**: ~20-30 seconds
- **Total Records**: 1000+ across all tables
- **Database Size**: ~50-100 MB after seeding

---

## Need Help?

1. **Check database logs:**
   ```powershell
   docker logs postgres-db
   ```

2. **Verify environment:**
   ```powershell
   .\scripts\verify-env.ps1
   ```

3. **Review seeder output:**
   - Look for error messages in console
   - Check which table failed
   - Verify foreign key relationships

---

## Summary

**Run this ONE command to get started:**

```powershell
.\scripts\seed-database.ps1
```

Your database will be fully populated with realistic data, ready for development and testing! 🚀
