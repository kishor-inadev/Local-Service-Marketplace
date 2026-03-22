# Diagnostic script to check .env configuration
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Environment Configuration Diagnostic" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (Test-Path .env) {
    Write-Host "✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "❌ .env file does NOT exist" -ForegroundColor Red
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ Created .env file" -ForegroundColor Green
}

Write-Host ""
Write-Host "Reading configuration from .env:" -ForegroundColor Yellow
Write-Host ""

# Initialize default values (same as start.ps1)
$API_GATEWAY_ENABLED = $true
$FRONTEND_ENABLED = $true

# Parse .env file (same logic as start.ps1)
Get-Content .env | ForEach-Object {
    # Strip comments and whitespace
    $line = $_ -replace '#.*$', ''
    $line = $line.Trim()
    
    if ($line -match "^API_GATEWAY_ENABLED=(.+)") {
        $value = $matches[1].Trim()
        $API_GATEWAY_ENABLED = $value -eq "true"
        Write-Host "  Found: API_GATEWAY_ENABLED=$value" -ForegroundColor Cyan
        Write-Host "  Parsed as: $API_GATEWAY_ENABLED" -ForegroundColor $(if ($API_GATEWAY_ENABLED) {'Green'} else {'Red'})
    }
    if ($line -match "^FRONTEND_ENABLED=(.+)") {
        $value = $matches[1].Trim()
        $FRONTEND_ENABLED = $value -eq "true"
        Write-Host "  Found: FRONTEND_ENABLED=$value" -ForegroundColor Cyan
        Write-Host "  Parsed as: $FRONTEND_ENABLED" -ForegroundColor $(if ($FRONTEND_ENABLED) {'Green'} else {'Red'})
    }
}

Write-Host ""
Write-Host "Results:" -ForegroundColor Yellow
Write-Host "  API_GATEWAY_ENABLED: $API_GATEWAY_ENABLED" -ForegroundColor $(if ($API_GATEWAY_ENABLED) {'Green'} else {'Red'})
Write-Host "  FRONTEND_ENABLED: $FRONTEND_ENABLED" -ForegroundColor $(if ($FRONTEND_ENABLED) {'Green'} else {'Red'})

Write-Host ""
Write-Host "Impact on Docker profiles:" -ForegroundColor Yellow

if ($FRONTEND_ENABLED) {
    Write-Host "  'frontend' profile will be used (includes API Gateway)" -ForegroundColor Green
} elseif ($API_GATEWAY_ENABLED) {
    Write-Host "  'gateway' profile will be used" -ForegroundColor Green
} else {
    Write-Host "  No gateway will start (both disabled)" -ForegroundColor Red
}

Write-Host ""
Write-Host "To enable API Gateway, ensure .env contains:" -ForegroundColor Yellow
Write-Host "  API_GATEWAY_ENABLED=true" -ForegroundColor Cyan

Write-Host ""
Write-Host "To check your .env settings:" -ForegroundColor Yellow
Write-Host "  Get-Content .env | Select-String 'API_GATEWAY\|FRONTEND'" -ForegroundColor Gray
Write-Host ""
