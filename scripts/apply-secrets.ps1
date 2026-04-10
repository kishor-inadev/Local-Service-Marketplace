# Apply Production Secrets to All Services
# Local Service Marketplace Platform

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "Applying Secrets to All Services" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if secrets.env exists
if (-not (Test-Path "secrets.env")) {
    Write-Host "ERROR: secrets.env not found!" -ForegroundColor Red
    Write-Host "Run .\scripts\generate-production-secrets.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Read secrets from secrets.env
$secrets = @{}
Get-Content "secrets.env" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
        $secrets[$matches[1].Trim()] = $matches[2].Trim()
    }
}

Write-Host "Loaded $($secrets.Count) secrets from secrets.env`n" -ForegroundColor Green

# Services that need JWT secrets
$services = @(
    "auth-service",
    "user-service",
    "request-service",
    "proposal-service",
    "job-service",
    "payment-service",
    "notification-service",
    "review-service",
    "admin-service",
    "analytics-service",
    "infrastructure-service",
    "messaging-service"
)

function Update-EnvFile {
    param(
        [string]$FilePath,
        [hashtable]$Secrets
    )

    if (-not (Test-Path $FilePath)) {
        Write-Host "  ⚠️  File not found: $FilePath" -ForegroundColor Yellow
        return
    }

    $content = Get-Content $FilePath -Raw
    
    # Update JWT secrets
    if ($Secrets.ContainsKey('JWT_SECRET')) {
        $content = $content -replace 'JWT_SECRET=.*', "JWT_SECRET=$($Secrets['JWT_SECRET'])"
    }
    if ($Secrets.ContainsKey('JWT_REFRESH_SECRET')) {
        $content = $content -replace 'JWT_REFRESH_SECRET=.*', "JWT_REFRESH_SECRET=$($Secrets['JWT_REFRESH_SECRET'])"
    }
    
    # Update database password
    if ($Secrets.ContainsKey('DATABASE_PASSWORD')) {
        $content = $content -replace 'DATABASE_PASSWORD=postgres', "DATABASE_PASSWORD=$($Secrets['DATABASE_PASSWORD'])"
    }
    
    # Save updated content
    Set-Content -Path $FilePath -Value $content -NoNewline
    Write-Host "  ✅ Updated: $FilePath" -ForegroundColor Green
}

# Update backend service .env files
Write-Host "Updating Backend Services..." -ForegroundColor Cyan
foreach ($service in $services) {
    $envPath = "services\$service\.env"
    Update-EnvFile -FilePath $envPath -Secrets $secrets
}

# Update frontend .env.local
Write-Host "`nUpdating Frontend..." -ForegroundColor Cyan
$frontendEnv = "frontend\.env.local"
if (Test-Path $frontendEnv) {
    $content = Get-Content $frontendEnv -Raw
    
    # Update AUTH_SECRET for NextAuth
    if ($secrets.ContainsKey('SESSION_SECRET')) {
        $content = $content -replace 'AUTH_SECRET=.*', "AUTH_SECRET=$($secrets['SESSION_SECRET'])"
    }
    
    Set-Content -Path $frontendEnv -Value $content -NoNewline
    Write-Host "  ✅ Updated: $frontendEnv" -ForegroundColor Green
}

# Update .env in root (if exists)
Write-Host "`nUpdating Root Environment..." -ForegroundColor Cyan
if (Test-Path ".env") {
    Update-EnvFile -FilePath ".env" -Secrets $secrets
}

# Create docker.env for docker compose
Write-Host "`nCreating docker.env for Docker Compose..." -ForegroundColor Cyan
$dockerEnv = @"
# Docker Compose Environment Variables
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

JWT_SECRET=$($secrets['JWT_SECRET'])
JWT_REFRESH_SECRET=$($secrets['JWT_REFRESH_SECRET'])
DATABASE_PASSWORD=$($secrets['DATABASE_PASSWORD'])
REDIS_PASSWORD=$($secrets['REDIS_PASSWORD'])
SESSION_SECRET=$($secrets['SESSION_SECRET'])
ENCRYPTION_KEY=$($secrets['ENCRYPTION_KEY'])

# Optional: Set to true to enable
EVENT_BUS_ENABLED=false
CACHE_ENABLED=false
"@

Set-Content -Path "docker.env" -Value $dockerEnv
Write-Host "  ✅ Created: docker.env" -ForegroundColor Green

Write-Host "`n========================================"  -ForegroundColor Green
Write-Host "✅ Secrets Applied Successfully!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Updated files:" -ForegroundColor Yellow
Write-Host "  • $($services.Count) backend service .env files" -ForegroundColor White
Write-Host "  • Frontend .env.local" -ForegroundColor White
Write-Host "  • docker.env (for Docker Compose)" -ForegroundColor White

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Review the changes in each .env file" -ForegroundColor White
Write-Host "  2. Restart Docker containers: docker compose down && docker compose up -d" -ForegroundColor White
Write-Host "  3. Restart frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "`n⚠️  DO NOT COMMIT secrets.env, docker.env, or updated .env files to Git!`n" -ForegroundColor Red
