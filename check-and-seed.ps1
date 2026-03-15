# Check Docker Services and Seed Database
# Run this after Docker build completes

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Service Health Check & Database Seeding" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if services are running
Write-Host "Step 1: Checking Docker services..." -ForegroundColor Yellow
$running = @(docker ps --format "{{.Names}}" | Where-Object { $_ -match "service|gateway|postgres" })

if ($running.Count -eq 0) {
    Write-Host "  ❌ No services are running yet" -ForegroundColor Red
    Write-Host "  ℹ️  Docker build may still be in progress" -ForegroundColor Yellow
    Write-Host "  Run: docker-compose logs -f  (to see build progress)" -ForegroundColor Cyan
    exit 1
}

Write-Host "  ✅ Found $($running.Count) running services`n" -ForegroundColor Green

# Show running services
Write-Host "Running services:" -ForegroundColor Cyan
$running | Sort-Object | ForEach-Object {
    Write-Host "  ✓ $_" -ForegroundColor Green
}

# Wait for postgres to be ready
Write-Host "`nStep 2: Waiting for PostgreSQL..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$pgReady = $false

while ($attempt -lt $maxAttempts -and -not $pgReady) {
    $attempt++
    try {
        $result = docker exec marketplace-postgres pg_isready -U postgres 2>&1
        if ($result -match "accepting connections") {
            $pgReady = $true
            Write-Host "  ✅ PostgreSQL is ready" -ForegroundColor Green
        } else {
            Write-Host "  ⏳ Attempt $attempt/$maxAttempts - Waiting..." -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
    } catch {
        Write-Host "  ⏳ Attempt $attempt/$maxAttempts - Waiting..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $pgReady) {
    Write-Host "  ❌ PostgreSQL did not become ready in time" -ForegroundColor Red
    exit 1
}

# Check API Gateway
Write-Host "`nStep 3: Checking API Gateway..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3500/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "  ✅ API Gateway is responding (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  API Gateway not ready yet" -ForegroundColor Yellow
    Write-Host "  Services may still be starting up" -ForegroundColor Gray
}

# Prompt for database seeding
Write-Host "`nStep 4: Database Seeding" -ForegroundColor Yellow
Write-Host "  Would you like to seed the database with test data?" -ForegroundColor Cyan
Write-Host "  This will create 1000+ sample records (users, jobs, payments, etc.)`n" -ForegroundColor Gray

$response = Read-Host "Seed database? (Y/N)"

if ($response -eq 'Y' -or $response -eq 'y') {
    Write-Host "`n  Starting database seeding..." -ForegroundColor Yellow
    & ".\seed-database.ps1"
} else {
    Write-Host "`n  Skipping database seeding" -ForegroundColor Gray
    Write-Host "  You can run it later with: .\seed-database.ps1`n" -ForegroundColor Cyan
}

# Final status
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ENVIRONMENT READY" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Services running: $($running.Count)" -ForegroundColor White
Write-Host "API Gateway: http://localhost:3500" -ForegroundColor Cyan
Write-Host "Database: localhost:5432" -ForegroundColor Cyan

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Start frontend: cd frontend; npm run dev" -ForegroundColor White
Write-Host "  2. Open browser: http://localhost:3000" -ForegroundColor White
Write-Host "  3. Check docs: docs/QUICK_START.md`n" -ForegroundColor White

Write-Host "========================================`n" -ForegroundColor Cyan
