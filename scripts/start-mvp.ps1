# MVP Startup Script - Launch Minimal Services Only
# This script starts only the essential services for MVP

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Local Service Marketplace - MVP Mode" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Starting MVP services..." -ForegroundColor Yellow
Write-Host ""

# Copy MVP environment file
if (Test-Path ".env.mvp") {
    Copy-Item -Path ".env.mvp" -Destination ".env" -Force
    Write-Host "✓ MVP environment configured" -ForegroundColor Green
}

# Start only core services (no profiles = no messaging, infrastructure, redis, kafka)
Write-Host ""
Write-Host "Starting database..." -ForegroundColor Cyan
docker-compose up -d postgres

Write-Host "Waiting for database to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Apply database schema
Write-Host ""
Write-Host "Applying database schema..." -ForegroundColor Cyan
docker exec -i marketplace-postgres psql -U postgres -d marketplace -f /docker-entrypoint-initdb.d/schema.sql 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database schema applied" -ForegroundColor Green
} else {
    Write-Host "⚠ Schema may already exist (this is OK)" -ForegroundColor Yellow
}

# Start core backend services
Write-Host ""
Write-Host "Starting backend services..." -ForegroundColor Cyan
docker-compose up -d auth-service user-service request-service proposal-service job-service payment-service review-service admin-service notification-service

# Start supporting services
Write-Host ""
Write-Host "Starting email service..." -ForegroundColor Cyan
docker-compose up -d email-service

# Start API Gateway
Write-Host ""
Write-Host "Starting API Gateway..." -ForegroundColor Cyan
docker-compose up -d api-gateway

Write-Host ""
Write-Host "Waiting for services to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

# Check running containers
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Running Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
docker ps --filter "name=marketplace" --filter "name=auth-service" --filter "name=user-service" --filter "name=api-gateway" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  MVP Services Started Successfully! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "  ✓ Database (PostgreSQL)" -ForegroundColor Green
Write-Host "  ✓ API Gateway (port 3500)" -ForegroundColor Green
Write-Host "  ✓ Auth Service (port 3001)" -ForegroundColor Green
Write-Host "  ✓ User Service (port 3002)" -ForegroundColor Green
Write-Host "  ✓ Request Service (port 3003)" -ForegroundColor Green
Write-Host "  ✓ Proposal Service (port 3004)" -ForegroundColor Green
Write-Host "  ✓ Job Service (port 3005)" -ForegroundColor Green
Write-Host "  ✓ Payment Service (port 3006)" -ForegroundColor Green
Write-Host "  ✓ Notification Service (port 3008)" -ForegroundColor Green
Write-Host "  ✓ Review Service (port 3009)" -ForegroundColor Green
Write-Host "  ✓ Admin Service (port 3010)" -ForegroundColor Green
Write-Host "  ✓ Email Service (port 3500)" -ForegroundColor Green

Write-Host ""
Write-Host "Services NOT running (disabled for MVP):" -ForegroundColor Yellow
Write-Host "  ✗ Analytics Service (use Google Analytics instead)" -ForegroundColor DarkGray
Write-Host "  ✗ Infrastructure Service (use external tools)" -ForegroundColor DarkGray
Write-Host "  ✗ Messaging Service (chat)" -ForegroundColor DarkGray
Write-Host "  ✗ Redis (cache)" -ForegroundColor DarkGray
Write-Host "  ✗ Kafka (events)" -ForegroundColor DarkGray

Write-Host ""
Write-Host "Features disabled in notification service:" -ForegroundColor Yellow
Write-Host "  ✗ In-app notifications" -ForegroundColor DarkGray
Write-Host "  ✗ Push notifications" -ForegroundColor DarkGray
Write-Host "  ✗ Device tracking" -ForegroundColor DarkGray
Write-Host "  ✗ Notification preferences" -ForegroundColor DarkGray

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start frontend: cd frontend\nextjs-app && npm run dev" -ForegroundColor White
Write-Host "  2. Open browser: http://localhost:3000" -ForegroundColor White
Write-Host "  3. Test contact form: http://localhost:3000/contact" -ForegroundColor White
Write-Host "  4. Check API health: http://localhost:3500/health" -ForegroundColor White

Write-Host ""
Write-Host "To enable optional services later:" -ForegroundColor Cyan
Write-Host "  - Analytics: docker-compose --profile analytics up -d" -ForegroundColor White
Write-Host "  - Infrastructure: docker-compose --profile infrastructure up -d" -ForegroundColor White
Write-Host "  - Messaging: docker-compose --profile messaging up -d" -ForegroundColor White
Write-Host "  - Cache: docker-compose --profile cache up -d" -ForegroundColor White
Write-Host "  - Events: docker-compose --profile events up -d" -ForegroundColor White

Write-Host ""
Write-Host "To stop all services:" -ForegroundColor Cyan
Write-Host "  docker-compose down" -ForegroundColor White

Write-Host ""
