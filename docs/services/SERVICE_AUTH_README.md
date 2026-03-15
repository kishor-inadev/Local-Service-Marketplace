# Auth Service

Production-grade authentication microservice for the Local Service Marketplace platform.

## Features

- ✅ User signup with email and password
- ✅ User login with JWT authentication
- ✅ Refresh token mechanism
- ✅ Email verification tokens
- ✅ Password reset flow
- ✅ Login attempt tracking and rate limiting
- ✅ Bcrypt password hashing
- ✅ Structured logging with Winston
- ✅ DTO validation with class-validator
- ✅ Repository pattern for database operations
- ✅ Global exception handling
- ✅ PostgreSQL database with UUID primary keys
- ✅ Docker and Docker Compose support
- ✅ Integration tests with Jest and Supertest

## Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Logging**: Winston
- **Validation**: class-validator
- **Testing**: Jest, Supertest
- **Containerization**: Docker

## Architecture

```
src/
├── common/
│   ├── config/
│   │   └── winston.config.ts
│   ├── database/
│   │   └── database.module.ts
│   ├── exceptions/
│   │   └── http.exceptions.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── logger/
│       └── logger.module.ts
├── modules/
│   └── auth/
│       ├── controllers/
│       │   └── auth.controller.ts
│       ├── dto/
│       │   ├── auth-response.dto.ts
│       │   ├── login.dto.ts
│       │   ├── password-reset-confirm.dto.ts
│       │   ├── password-reset-request.dto.ts
│       │   ├── refresh-token.dto.ts
│       │   └── signup.dto.ts
│       ├── entities/
│       │   ├── email-verification-token.entity.ts
│       │   ├── login-attempt.entity.ts
│       │   ├── password-reset-token.entity.ts
│       │   ├── session.entity.ts
│       │   ├── social-account.entity.ts
│       │   ├── user-device.entity.ts
│       │   └── user.entity.ts
│       ├── guards/
│       │   └── jwt-auth.guard.ts
│       ├── repositories/
│       │   ├── email-verification-token.repository.ts
│       │   ├── login-attempt.repository.ts
│       │   ├── password-reset-token.repository.ts
│       │   ├── session.repository.ts
│       │   └── user.repository.ts
│       ├── services/
│       │   ├── auth.service.ts
│       │   ├── jwt.service.ts
│       │   └── token.service.ts
│       └── auth.module.ts
├── app.module.ts
└── main.ts
```

## Database Tables Owned

- `users`
- `sessions`
- `email_verification_tokens`
- `password_reset_tokens`
- `login_attempts`
- `social_accounts`
- `user_devices`

## API Endpoints

### POST /auth/signup

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer",
    "email_verified": false
  }
}
```

### POST /auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer",
    "email_verified": false
  }
}
```

### POST /auth/logout

Logout and invalidate refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### POST /auth/refresh

Get a new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /auth/password-reset/request

Request a password reset token.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset email sent if account exists"
}
```

### POST /auth/password-reset/confirm

Reset password using token.

**Request Body:**
```json
{
  "token": "random-token-string",
  "newPassword": "NewSecurePass123!"
}
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

## Installation

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Create database:**
   ```bash
   createdb marketplace_auth
   psql marketplace_auth < ../../database/schema.sql
   ```

4. **Run in development mode:**
   ```bash
   npm run start:dev
   ```

### Using Docker

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

   This will start both PostgreSQL and the auth service.

2. **Run in detached mode:**
   ```bash
   docker-compose up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f auth-service
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Service port | `3001` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USER` | Database user | `postgres` |
| `DATABASE_PASSWORD` | Database password | `postgres` |
| `DATABASE_NAME` | Database name | `marketplace_auth` |
| `JWT_SECRET` | JWT secret key | (required) |
| `JWT_EXPIRATION` | Access token expiration | `15m` |
| `JWT_REFRESH_SECRET` | Refresh token secret | (required) |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiration | `7d` |
| `MAX_LOGIN_ATTEMPTS` | Max failed login attempts | `5` |
| `EMAIL_VERIFICATION_EXPIRES_IN` | Email verification expiry | `24h` |
| `PASSWORD_RESET_EXPIRES_IN` | Password reset expiry | `1h` |

## Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Refresh Tokens**: Long-lived tokens stored in database
- **Rate Limiting**: Login attempt tracking
- **Email Verification**: Token-based email verification
- **Password Reset**: Secure token-based password reset
- **Input Validation**: DTO validation with class-validator
- **SQL Injection Protection**: Parameterized queries

## Logging

Structured logging with Winston:
- Console output with colors (development)
- File logging (`logs/error.log`, `logs/combined.log`)
- JSON format for production
- Request/response logging
- Error stack traces

## Production Considerations

1. **Change JWT secrets** in production
2. **Enable HTTPS** for API endpoints
3. **Set up email service** for verification and reset emails
4. **Configure rate limiting** at API gateway level
5. **Enable database connection pooling**
6. **Set up monitoring** and alerting
7. **Regular security audits**
8. **Database backups**

## License

MIT
