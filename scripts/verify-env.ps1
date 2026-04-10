# ===============================================
# Environment Variables Verification Script
# Validates all .env files exist and are properly configured
# ===============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Environment Variables Verification" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$errors = @()
$warnings = @()
$success = 0

# Function to check if file exists
function Test-EnvFile {
    param(
        [string]$Path,
        [string]$Name
    )
    
    if (Test-Path $Path) {
        Write-Host "✅ $Name" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Name - MISSING" -ForegroundColor Red
        $script:errors += "$Name is missing"
        return $false
    }
}

# Function to check for required variable in file
function Test-EnvVariable {
    param(
        [string]$FilePath,
        [string]$Variable,
        [string]$ServiceName
    )
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        if ($content -match "^$Variable=", "Multiline") {
            return $true
        } else {
            $script:warnings += "$ServiceName is missing $Variable"
            return $false
        }
    }
    return $false
}

Write-Host "Checking .env.example files..." -ForegroundColor Yellow
Write-Host "--------------------------------------`n"

# Root
Test-EnvFile -Path ".\.env.example" -Name "Root .env.example"

# Services
Test-EnvFile -Path ".\services\auth-service\.env.example" -Name "Auth Service .env.example"
Test-EnvFile -Path ".\services\user-service\.env.example" -Name "User Service .env.example"
Test-EnvFile -Path ".\services\request-service\.env.example" -Name "Request Service .env.example"
Test-EnvFile -Path ".\services\proposal-service\.env.example" -Name "Proposal Service .env.example"
Test-EnvFile -Path ".\services\job-service\.env.example" -Name "Job Service .env.example"
Test-EnvFile -Path ".\services\payment-service\.env.example" -Name "Payment Service .env.example"
Test-EnvFile -Path ".\services\messaging-service\.env.example" -Name "Messaging Service .env.example"
Test-EnvFile -Path ".\services\notification-service\.env.example" -Name "Notification Service .env.example"
Test-EnvFile -Path ".\services\review-service\.env.example" -Name "Review Service .env.example"
Test-EnvFile -Path ".\services\admin-service\.env.example" -Name "Admin Service .env.example"
Test-EnvFile -Path ".\services\analytics-service\.env.example" -Name "Analytics Service .env.example"
Test-EnvFile -Path ".\services\infrastructure-service\.env.example" -Name "Infrastructure Service .env.example"
Test-EnvFile -Path ".\services\email-service\.env.example" -Name "Email Service .env.example"
Test-EnvFile -Path ".\services\sms-service\.env.example" -Name "SMS Service .env.example"

# API Gateway and Frontend
Test-EnvFile -Path ".\api-gateway\.env.example" -Name "API Gateway .env.example"
Test-EnvFile -Path ".\frontend\nextjs-app\.env.example" -Name "Frontend .env.example"

Write-Host "`nChecking .env files..." -ForegroundColor Yellow
Write-Host "--------------------------------------`n"

# Root
Test-EnvFile -Path ".\.env" -Name "Root .env"

# Services
Test-EnvFile -Path ".\services\auth-service\.env" -Name "Auth Service .env"
Test-EnvFile -Path ".\services\user-service\.env" -Name "User Service .env"
Test-EnvFile -Path ".\services\request-service\.env" -Name "Request Service .env"
Test-EnvFile -Path ".\services\proposal-service\.env" -Name "Proposal Service .env"
Test-EnvFile -Path ".\services\job-service\.env" -Name "Job Service .env"
Test-EnvFile -Path ".\services\payment-service\.env" -Name "Payment Service .env"
Test-EnvFile -Path ".\services\messaging-service\.env" -Name "Messaging Service .env"
Test-EnvFile -Path ".\services\notification-service\.env" -Name "Notification Service .env"
Test-EnvFile -Path ".\services\review-service\.env" -Name "Review Service .env"
Test-EnvFile -Path ".\services\admin-service\.env" -Name "Admin Service .env"
Test-EnvFile -Path ".\services\analytics-service\.env" -Name "Analytics Service .env"
Test-EnvFile -Path ".\services\infrastructure-service\.env" -Name "Infrastructure Service .env"
Test-EnvFile -Path ".\services\email-service\.env" -Name "Email Service .env"
Test-EnvFile -Path ".\services\sms-service\.env" -Name "SMS Service .env"

# API Gateway and Frontend
Test-EnvFile -Path ".\api-gateway\.env" -Name "API Gateway .env"
Test-EnvFile -Path ".\frontend\nextjs-app\.env.local" -Name "Frontend .env.local"

Write-Host "`nChecking critical environment variables..." -ForegroundColor Yellow
Write-Host "--------------------------------------`n"

# Check critical variables in auth service
if (Test-Path ".\services\auth-service\.env") {
    $criticalVars = @("DATABASE_NAME", "JWT_SECRET", "REDIS_URL", "KAFKA_BROKERS")
    foreach ($var in $criticalVars) {
        if (Test-EnvVariable -FilePath ".\services\auth-service\.env" -Variable $var -ServiceName "Auth Service") {
            Write-Host "✅ Auth Service has $var" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Auth Service missing $var" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nChecking database configuration..." -ForegroundColor Yellow
Write-Host "--------------------------------------`n"

# Check if all services use correct database name
$services = @(
    "auth-service", "user-service", "request-service", "proposal-service",
    "job-service", "payment-service", "messaging-service", "notification-service",
    "review-service", "admin-service", "analytics-service", "infrastructure-service"
)

foreach ($service in $services) {
    $envFile = ".\services\$service\.env"
    if (Test-Path $envFile) {
        $content = Get-Content $envFile -Raw
        if ($content -match "DATABASE_NAME=marketplace") {
            Write-Host "✅ $service uses correct database name (marketplace)" -ForegroundColor Green
            $script:success++
        } else {
            Write-Host "❌ $service has incorrect database name" -ForegroundColor Red
            $script:errors += "$service database name issue"
        }
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Errors: $($errors.Count)" -ForegroundColor $(if ($errors.Count -eq 0) { "Green" } else { "Red" })
Write-Host "Warnings: $($warnings.Count)" -ForegroundColor $(if ($warnings.Count -eq 0) { "Green" } else { "Yellow" })
Write-Host "Database configs correct: $success/12`n" -ForegroundColor Green

if ($errors.Count -gt 0) {
    Write-Host "ERRORS FOUND:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "WARNINGS:" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    Write-Host ""
}

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ All environment files are properly configured!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Customize security variables (JWT_SECRET, passwords)" -ForegroundColor White
    Write-Host "2. Configure email provider in services/email-service/.env" -ForegroundColor White
    Write-Host "3. Run: docker compose up -d postgres redis" -ForegroundColor White
    Write-Host "4. Run: npm run dev (in each service) or docker compose up" -ForegroundColor White
} else {
    Write-Host "❌ Please fix the issues above before proceeding" -ForegroundColor Red
}

Write-Host ""
