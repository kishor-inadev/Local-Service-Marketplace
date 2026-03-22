# ===============================================
# Environment Setup Script
# Copies .env.example to .env for all services
# ===============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Environment Files Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$created = 0
$skipped = 0
$errors = 0

# Function to copy .env.example to .env
function Setup-EnvFile {
    param (
        [string]$Path,
        [string]$ServiceName
    )
    
    $exampleFile = Join-Path $Path ".env.example"
    $envFile = Join-Path $Path ".env"
    
    if (Test-Path $exampleFile) {
        if (Test-Path $envFile) {
            Write-Host "  [SKIP] $ServiceName - .env already exists" -ForegroundColor Yellow
            $script:skipped++
        } else {
            try {
                Copy-Item $exampleFile $envFile
                Write-Host "  [CREATE] $ServiceName - .env created from .env.example" -ForegroundColor Green
                $script:created++
            } catch {
                Write-Host "  [ERROR] $ServiceName - Failed to create .env: $_" -ForegroundColor Red
                $script:errors++
            }
        }
    } else {
        Write-Host "  [WARNING] $ServiceName - .env.example not found" -ForegroundColor Magenta
    }
}

Write-Host "Setting up environment files..." -ForegroundColor White
Write-Host ""

# Root directory
Write-Host "Root:" -ForegroundColor Cyan
Setup-EnvFile -Path "." -ServiceName "Root (.env)"
Write-Host ""

# API Gateway
Write-Host "API Gateway:" -ForegroundColor Cyan
Setup-EnvFile -Path "api-gateway" -ServiceName "API Gateway"
Write-Host ""

# Frontend
Write-Host "Frontend:" -ForegroundColor Cyan
Setup-EnvFile -Path "frontend\nextjs-app" -ServiceName "Next.js Frontend"
Write-Host ""

# Backend Services
Write-Host "Backend Services:" -ForegroundColor Cyan
$services = @(
    "auth-service",
    "user-service",
    "request-service",
    "proposal-service",
    "job-service",
    "payment-service",
    "messaging-service",
    "notification-service",
    "review-service",
    "admin-service",
    "analytics-service",
    "infrastructure-service"
)

foreach ($service in $services) {
    $servicePath = Join-Path "services" $service
    Setup-EnvFile -Path $servicePath -ServiceName $service
}

Write-Host ""

# External Services
Write-Host "External Services:" -ForegroundColor Cyan
Setup-EnvFile -Path "services\email-service" -ServiceName "Email Service"
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Created:  $created files" -ForegroundColor Green
Write-Host "  Skipped:  $skipped files (already exist)" -ForegroundColor Yellow
Write-Host "  Errors:   $errors files" -ForegroundColor Red
Write-Host ""

if ($created -gt 0) {
    Write-Host "IMPORTANT: Review and update the following in your .env files:" -ForegroundColor Yellow
    Write-Host "  1. JWT_SECRET - Must be at least 32 characters" -ForegroundColor White
    Write-Host "  2. JWT_REFRESH_SECRET - Different from JWT_SECRET" -ForegroundColor White
    Write-Host "  3. GATEWAY_INTERNAL_SECRET - For secure gateway communication" -ForegroundColor White
    Write-Host "  4. DATABASE_PASSWORD - Change from default 'postgres'" -ForegroundColor White
    Write-Host "  5. REDIS_PASSWORD - Set if using password-protected Redis" -ForegroundColor White
    Write-Host "  6. Email/SMS credentials - If using those features" -ForegroundColor White
    Write-Host ""
    Write-Host "Generate secure secrets with:" -ForegroundColor Cyan
    Write-Host "  openssl rand -base64 48" -ForegroundColor Gray
    Write-Host ""
}

if ($errors -eq 0) {
    Write-Host "Setup completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Setup completed with errors. Please review the messages above." -ForegroundColor Red
}

Write-Host ""
