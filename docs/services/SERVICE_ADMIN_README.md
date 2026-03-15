# Admin Service

A production-ready NestJS microservice for administrative operations and platform moderation in the Local Service Marketplace platform.

## Features

- **User Moderation**: View, search, suspend, and unsuspend users
- **Dispute Resolution**: Manage and resolve disputes between users
- **Audit Logging**: Track all administrative actions with detailed logs
- **System Configuration**: Manage platform-wide settings
- **Comprehensive Validation**: DTO validation with class-validator
- **Structured Logging**: Winston-based logging with file and console transports
- **Error Handling**: Global exception filters with standardized responses
- **E2E Testing**: Comprehensive integration tests with Jest and Supertest
- **Docker Support**: Full containerization with Docker Compose

## Architecture

This service follows the NestJS modular architecture:

```
src/
├── common/                 # Shared infrastructure
│   ├── config/             # Winston configuration
│   ├── database/           # Database connection module
│   ├── exceptions/         # Custom exception classes
│   ├── filters/            # Global exception filters
│   └── logger/             # Logger module
├── admin/                  # Admin domain module
│   ├── dto/                # Data transfer objects with validation
│   ├── entities/           # Domain entities
│   ├── repositories/       # Database access layer
│   ├── services/           # Business logic
│   ├── admin.controller.ts
│   └── admin.module.ts
├── app.module.ts           # Root application module
└── main.ts                 # Application bootstrap
```

## Database Schema

The service owns the following tables:

- **admin_actions**: Tracks all administrative actions (suspend, resolve disputes, etc.)
- **disputes**: Dispute records between users/providers
- **audit_logs**: Comprehensive audit trail of all system actions
- **system_settings**: Platform-wide configuration settings

## API Endpoints

### User Moderation

- `GET /admin/users` - List all users with pagination and search
- `GET /admin/users/:id` - Get user by ID
- `PATCH /admin/users/:id/suspend` - Suspend/unsuspend a user

### Dispute Management

- `GET /admin/disputes` - List all disputes with pagination and status filter
- `GET /admin/disputes/:id` - Get dispute by ID
- `PATCH /admin/disputes/:id` - Update dispute status and resolution

### Audit Logs

- `GET /admin/audit-logs` - List audit logs with pagination
- `GET /admin/audit-logs?userId={userId}` - Get logs by user
- `GET /admin/audit-logs/entity/:entity/:entityId` - Get logs by entity

### System Settings

- `GET /admin/settings` - Get all system settings
- `GET /admin/settings/:key` - Get setting by key
- `PATCH /admin/settings/:key` - Update setting value

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```env
PORT=3010
DATABASE_HOST=localhost
DATABASE_PORT=5441
DATABASE_NAME=admin_service_db
DATABASE_USER=admin_service_user
DATABASE_PASSWORD=admin_service_password
```

4. Set up the database:
```bash
# Create database
createdb admin_service_db

# Run schema
psql -d admin_service_db -f init-db.sql
```

### Running the Service

#### Development Mode
```bash
npm run start:dev
```

#### Production Mode
```bash
npm run build
npm run start:prod
```

#### Docker Compose
```bash
docker-compose up --build
```

The service will be available at `http://localhost:3010`.

## Testing

### Run E2E Tests
```bash
npm run test:e2e
```

### Run Unit Tests
```bash
npm run test
```

### Test Coverage
```bash
npm run test:cov
```

## API Examples

### Get All Users

```bash
curl "http://localhost:3010/admin/users?limit=20&offset=0"
```

Response:
```json
[
  {
    "id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "suspended": false,
    "createdAt": "2026-03-12T10:30:00.000Z"
  }
]
```

### Search Users

```bash
curl "http://localhost:3010/admin/users?search=john"
```

### Suspend User

```bash
curl -X PATCH http://localhost:3010/admin/users/550e8400-e29b-41d4-a716-446655440000/suspend \
  -H "Content-Type: application/json" \
  -H "x-admin-id: 550e8400-e29b-41d4-a716-446655440001" \
  -d '{
    "suspended": true,
    "reason": "Violation of terms of service"
  }'
```

### Get All Disputes

```bash
curl "http://localhost:3010/admin/disputes?limit=20&offset=0"
```

Response:
```json
{
  "disputes": [
    {
      "id": "...",
      "jobId": "...",
      "openedBy": "...",
      "reason": "Payment issue",
      "status": "open",
      "resolution": null,
      "resolvedBy": null,
      "resolvedAt": null,
      "createdAt": "2026-03-12T10:30:00.000Z"
    }
  ],
  "total": 15
}
```

### Filter Disputes by Status

```bash
curl "http://localhost:3010/admin/disputes?status=open"
```

### Update Dispute

```bash
curl -X PATCH http://localhost:3010/admin/disputes/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "x-admin-id: 550e8400-e29b-41d4-a716-446655440001" \
  -d '{
    "status": "resolved",
    "resolution": "Issue resolved through mediation. Refund processed."
  }'
```

### Get Audit Logs

```bash
curl "http://localhost:3010/admin/audit-logs?limit=50&offset=0"
```

Response:
```json
{
  "logs": [
    {
      "id": "...",
      "userId": "...",
      "action": "suspend_user",
      "entity": "user",
      "entityId": "...",
      "metadata": {
        "reason": "Violation of terms",
        "suspended": true
      },
      "createdAt": "2026-03-12T10:30:00.000Z"
    }
  ],
  "total": 150
}
```

### Get Audit Logs by User

```bash
curl "http://localhost:3010/admin/audit-logs?userId=550e8400-e29b-41d4-a716-446655440000"
```

### Get System Settings

```bash
curl http://localhost:3010/admin/settings
```

Response:
```json
[
  {
    "key": "platform_fee",
    "value": "10",
    "description": "Platform fee percentage",
    "updatedAt": "2026-03-12T10:30:00.000Z"
  }
]
```

### Update System Setting

```bash
curl -X PATCH http://localhost:3010/admin/settings/platform_fee \
  -H "Content-Type: application/json" \
  -H "x-admin-id: 550e8400-e29b-41d4-a716-446655440001" \
  -d '{
    "value": "15"
  }'
```

## Service Boundaries

This service **owns** the following data:
- Admin actions (all administrative operations)
- Disputes (dispute records and resolutions)
- Audit logs (comprehensive activity tracking)
- System settings (platform configuration)

This service **does not own**:
- User data (managed by auth-service)
- Job data (managed by job-service)

**Important**: Never perform cross-service database joins. Always use HTTP APIs to fetch data from other services.

## Business Logic

### User Moderation
1. Admin retrieves user list or searches for specific users
2. Admin can suspend/unsuspend users with reason
3. All suspension actions are logged in admin_actions and audit_logs
4. Suspended users cannot perform certain platform actions

### Dispute Resolution
1. Users open disputes related to jobs
2. Admin reviews dispute details
3. Admin updates dispute status (open → in_progress → resolved/closed)
4. Admin provides resolution explanation
5. All actions logged with timestamps and admin ID

### Audit Logging
1. All administrative actions automatically create audit logs
2. Logs include: user ID, action type, entity, metadata
3. Logs are queryable by user, entity, or time range
4. Logs are immutable (cannot be deleted or modified)

### System Configuration
1. Platform-wide settings stored as key-value pairs
2. Admin can update setting values
3. All changes tracked in audit logs
4. Settings include: platform fees, feature flags, limits, etc.

## Authentication & Authorization

**Admin ID Header**: All endpoints require `x-admin-id` header for tracking purposes.

In production, implement:
- JWT authentication middleware
- Role-based access control (RBAC)
- Admin permission verification
- Rate limiting for sensitive operations

Example middleware:
```typescript
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
```

## Dispute Status Flow

1. **open** - Newly created dispute
2. **in_progress** - Admin is reviewing/investigating
3. **resolved** - Dispute resolved with solution
4. **closed** - Dispute closed without resolution

## Logging

The service uses Winston for structured logging:

- **Console**: Colorized logs for development
- **Files**: 
  - `logs/error.log` - Error level logs
  - `logs/combined.log` - All logs

Log format includes:
- Timestamp
- Context (service/module name)
- Log level
- Message
- Metadata (request details, errors, etc.)

## Error Handling

Standardized error responses:

```json
{
  "statusCode": 404,
  "timestamp": "2026-03-12T10:30:00.000Z",
  "path": "/admin/users/invalid-id",
  "method": "GET",
  "message": "User not found"
}
```

## Validation Rules

### SuspendUserDto
- **suspended**: Required boolean (true/false)
- **reason**: Optional string (recommended for audit trail)

### UpdateDisputeDto
- **status**: Required, one of: ['open', 'in_progress', 'resolved', 'closed']
- **resolution**: Required string (explanation of resolution)

### UpdateSystemSettingDto
- **value**: Required string (new setting value)

## Docker Deployment

### Build Image
```bash
docker build -t admin-service .
```

### Run with Docker Compose
```bash
docker-compose up -d
```

This starts:
- Admin service on port 3010
- PostgreSQL database on port 5441

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f admin-service
```

## Integration with Other Services

### Auth Service
- Retrieve user details via GET /users/:id endpoint
- Validate admin permissions
- Check user authentication status

### Job Service
- Fetch job details for dispute context
- Verify job completion status
- Get job participants (client, provider)

### Payment Service
- Process refunds for resolved disputes
- Adjust payment status based on resolutions
- Track financial adjustments

## Performance Considerations

- **Connection Pooling**: PostgreSQL pool with max 20 connections
- **Parameterized Queries**: Prevents SQL injection, enables query plan caching
- **Indexed Columns**: admin_id, user_id, entity, entity_id, status, created_at
- **Pagination**: Default limits to prevent large data transfers
- **Audit Log Retention**: Consider archiving old logs to maintain performance

## Security

- Input validation on all endpoints
- Parameterized SQL queries prevent injection
- Password-protected database
- CORS enabled for cross-origin requests
- Admin action tracking for accountability
- Sensitive actions require admin authentication

## Monitoring & Alerts

Recommended monitoring:
- Failed login attempts
- Suspension rate trends
- Dispute resolution times
- Audit log anomalies
- System setting changes

Set up alerts for:
- High suspension rate
- Unresolved disputes older than 7 days
- Unauthorized access attempts
- Critical system setting changes

## Common Admin Actions

| Action | Log Type | Impact |
|--------|----------|--------|
| Suspend User | admin_actions, audit_logs | User account disabled |
| Resolve Dispute | admin_actions, audit_logs | Dispute closed |
| Update Settings | audit_logs | Platform behavior changed |
| Search Users | audit_logs | Privacy-sensitive operation |

## Future Enhancements

- [ ] Bulk user operations (mass suspend/unsuspend)
- [ ] Advanced dispute analytics
- [ ] Automated dispute detection (AI/ML)
- [ ] Admin activity dashboard
- [ ] Email notifications for dispute updates
- [ ] Dispute escalation workflow
- [ ] User communication interface
- [ ] Configurable admin roles and permissions
- [ ] Audit log export functionality
- [ ] Real-time admin activity monitoring

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `3010` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5441` |
| `DATABASE_NAME` | Database name | `admin_service_db` |
| `DATABASE_USER` | Database user | `admin_service_user` |
| `DATABASE_PASSWORD` | Database password | `admin_service_password` |

## License

MIT

## Support

For issues and questions, please contact the development team or open an issue in the repository.
