# Database Seeding

This directory contains scripts to populate your Local Service Marketplace database with realistic sample data.

## What Gets Seeded

The seeder creates **at least 50 records** for most tables, including:

### Core Data
- **151 Users**
  - 100 Customers
  - 50 Providers  
  - 1 Admin
- **15 Service Categories** (Plumbing, Electrical, Carpentry, etc.)
- **50 Providers** with complete profiles
- **150 Locations** across 10 major US cities

### Marketplace Data
- **120+ Service Requests** (including anonymous guest requests)
- **200+ Proposals** from providers
- **80+ Jobs** with various statuses
- **80+ Payments** with fees calculated
- **Reviews** for completed jobs (80% of completed jobs)
- **Messages** between customers and providers (3-15 per job)

### Additional Features
- **100 Sessions** for active users
- **200 Login Attempts** (success and failures)
- **Provider Availability** schedules
- **Provider Portfolio** items (2-8 per provider)
- **Provider Documents** (certifications, licenses)
- **300 Notifications** across all users
- **100 Favorites** (customers favoriting providers)
- **50 Coupons** with usage tracking
- **Subscriptions** for providers
- **Contact Messages** (80 support inquiries)
- **Daily Metrics** from Jan 1, 2024 to today
- **Admin Actions**, **Audit Logs**, **Events**, **Background Jobs**
- And more...

## Prerequisites

- PostgreSQL database running (via Docker or locally)
- Node.js and pnpm installed
- Database schema already applied (from `schema.sql`)

## Quick Start

### Option 1: Run from application root (Easiest)

```powershell
# Windows PowerShell
.\seed-database.ps1
```

This script will:
1. Load environment variables from `.env`
2. Check database connectivity
3. Install dependencies if needed
4. Run the seeder with confirmation

### Option 2: Run directly

```bash
# Navigate to database folder
cd database

# Install dependencies
pnpm install

# Run seeder
pnpm run seed
```

## Configuration

The seeder uses these environment variables (from `.env` or system):

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=marketplace
```

## Default Credentials

After seeding, you can login with:

**Admin Account:**
- Email: `admin@marketplace.com`
- Password: `password123`

**All Users:**
- Password: `password123`
- Emails follow pattern: `firstname.lastname@example.com`

## Sample Data Features

### Realistic Data
- Uses [@faker-js/faker](https://www.npmjs.com/package/@faker-js/faker) for realistic names, emails, addresses
- Proper relationships between tables (foreign keys)
- Time-based data (created dates, job completion dates)
- Geographic distribution across 10 major US cities

### Data Variety
- Multiple user roles (customers, providers, admins)
- Various job statuses (scheduled, in progress, completed, cancelled)
- Payment states (pending, completed, failed, refunded)
- Active and expired sessions
- Verified and unverified providers
- Anonymous and registered service requests

### Business Logic
- Platform fees calculated (15% of payment)
- Provider ratings automatically calculated from reviews
- Proper job completion flows
- Message threads for each job
- Notification delivery tracking

## Technical Details

### Dependencies
- `pg` - PostgreSQL client
- `bcrypt` - Password hashing
- `@faker-js/faker` - Fake data generation
- `ts-node` - TypeScript execution
- `dotenv` - Environment variable loading

### Seeding Order

The script seeds tables in dependency order:
1. Users and auth tables
2. Service categories
3. Providers and provider details
4. Locations
5. Service requests
6. Proposals and jobs
7. Payments and reviews
8. Messages and notifications
9. Supporting tables (coupons, settings, etc.)

### Performance

- Seeds 1000+ records in under 30 seconds
- Uses batch inserts where possible
- Proper transaction handling
- Error recovery

## Customization

Edit `seed.ts` to customize:

```typescript
// Change number of users
for (let i = 0; i < 100; i++) { // Change this number
  // Create customer
}

// Add more categories
const serviceCategories = [
  { name: 'Your Category', description: '...', icon: '🔧' },
  // Add more...
];

// Adjust date ranges
const randomDate = (start: Date, end: Date) => {
  // Customize date range
};
```

## Troubleshooting

### Database connection failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Ensure PostgreSQL is running:
```bash
docker-compose up postgres-db
```

### Schema not found errors
```
Error: relation "users" does not exist
```
**Solution:** Run the schema first:
```bash
docker exec -i postgres-db psql -U postgres -d marketplace < database/schema.sql
```

### Duplicate key errors
```
Error: duplicate key value violates unique constraint
```
**Solution:** The database already has data. Either:
- Clear the database first
- Modify seeder to handle conflicts

### Permission denied
```
Error: permission denied for table users
```
**Solution:** Ensure database user has proper permissions:
```sql
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
```

## Clearing Data

To reset the database before re-seeding:

```sql
-- Drop all tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Re-apply schema
\i database/schema.sql
```

Or use the cleanup script (if available):
```bash
docker exec -i postgres-db psql -U postgres -d marketplace -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker exec -i postgres-db psql -U postgres -d marketplace < database/schema.sql
```

## Production Note

⚠️ **NEVER run this seeder in production!**

This is for development and testing only. Sample data includes:
- Weak passwords (all `password123`)
- Fake personal information
- Test payment data
- Mock certifications

For production, use real data import or manual entry.

## Support

If you encounter issues:
1. Check database is running: `docker ps`
2. Verify schema is loaded: `docker exec postgres-db psql -U postgres -d marketplace -c "\dt"`
3. Check logs in console output
4. Review environment variables

## License

Part of the Local Service Marketplace application.
