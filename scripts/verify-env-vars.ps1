# ===============================================
# Environment Variables Verification Script
# Checks all .env files for required variables
# ===============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Environment Variables Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allValid = $true

# Function to check if a variable exists in .env file
function Test-EnvVariable {
    param (
        [string]$FilePath,
        [string]$VariableName,
        [string]$ServiceName,
        [switch]$Optional
    )
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "  [ERROR] $ServiceName - .env file not found" -ForegroundColor Red
        $script:allValid = $false
        return
    }
    
    $content = Get-Content $FilePath -Raw
    
    if ($content -match "^$VariableName\s*=" -or $content -match "`n$VariableName\s*=") {
        $value = (Get-Content $FilePath | Select-String -Pattern "^$VariableName\s*=(.*)$").Matches.Groups[1].Value.Trim()
        
        # Check if value is a placeholder that should be changed
        $placeholders = @(
            "your-",
            "change-",
            "example",
            "placeholder",
            "REPLACE_ME"
        )
        
        $isPlaceholder = $false
        foreach ($placeholder in $placeholders) {
            if ($value -like "*$placeholder*") {
                $isPlaceholder = $true
                break
            }
        }
        
        if ($isPlaceholder -and -not $Optional) {
            Write-Host "  [WARNING] $VariableName = $value (placeholder - should be changed)" -ForegroundColor Yellow
        } else {
            Write-Host "  [OK] $VariableName" -ForegroundColor Green
        }
    } else {
        if ($Optional) {
            Write-Host "  [OPTIONAL] $VariableName - not set" -ForegroundColor Gray
        } else {
            Write-Host "  [MISSING] $VariableName - REQUIRED!" -ForegroundColor Red
            $script:allValid = $false
        }
    }
}

# Check API Gateway
Write-Host "API Gateway (.env):" -ForegroundColor Cyan
$apiGatewayEnv = "api-gateway\.env"
Test-EnvVariable -FilePath $apiGatewayEnv -VariableName "PORT" -ServiceName "API Gateway"
Test-EnvVariable -FilePath $apiGatewayEnv -VariableName "JWT_SECRET" -ServiceName "API Gateway"
Test-EnvVariable -FilePath $apiGatewayEnv -VariableName "GATEWAY_INTERNAL_SECRET" -ServiceName "API Gateway"
Test-EnvVariable -FilePath $apiGatewayEnv -VariableName "TOKEN_VALIDATION_STRATEGY" -ServiceName "API Gateway"
Test-EnvVariable -FilePath $apiGatewayEnv -VariableName "AUTH_SERVICE_URL" -ServiceName "API Gateway"
Test-EnvVariable -FilePath $apiGatewayEnv -VariableName "CORS_ORIGIN" -ServiceName "API Gateway"
Write-Host ""

# Check Auth Service
Write-Host "Auth Service (.env):" -ForegroundColor Cyan
$authServiceEnv = "services\auth-service\.env"
Test-EnvVariable -FilePath $authServiceEnv -VariableName "PORT" -ServiceName "Auth Service"
Test-EnvVariable -FilePath $authServiceEnv -VariableName "DATABASE_URL" -ServiceName "Auth Service"
Test-EnvVariable -FilePath $authServiceEnv -VariableName "JWT_SECRET" -ServiceName "Auth Service"
Test-EnvVariable -FilePath $authServiceEnv -VariableName "JWT_REFRESH_SECRET" -ServiceName "Auth Service"
Test-EnvVariable -FilePath $authServiceEnv -VariableName "GATEWAY_INTERNAL_SECRET" -ServiceName "Auth Service"
Test-EnvVariable -FilePath $authServiceEnv -VariableName "FRONTEND_URL" -ServiceName "Auth Service"
Write-Host ""

# Check User Service
Write-Host "User Service (.env):" -ForegroundColor Cyan
$userServiceEnv = "services\user-service\.env"
if (Test-Path $userServiceEnv) {
    Test-EnvVariable -FilePath $userServiceEnv -VariableName "PORT" -ServiceName "User Service"
    Test-EnvVariable -FilePath $userServiceEnv -VariableName "DATABASE_URL" -ServiceName "User Service"
} else {
    Write-Host "  [INFO] .env file not found (will use .env.example)" -ForegroundColor Gray
}
Write-Host ""

# Check Frontend
Write-Host "Frontend (.env):" -ForegroundColor Cyan
$frontendEnv = "frontend\nextjs-app\.env"
if (Test-Path $frontendEnv) {
    Test-EnvVariable -FilePath $frontendEnv -VariableName "NEXT_PUBLIC_API_URL" -ServiceName "Frontend"
    Test-EnvVariable -FilePath $frontendEnv -VariableName "NEXT_PUBLIC_APP_NAME" -ServiceName "Frontend"
    Test-EnvVariable -FilePath $frontendEnv -VariableName "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" -ServiceName "Frontend" -Optional
} else {
    Write-Host "  [INFO] .env file not found (will use .env.example)" -ForegroundColor Gray
}
Write-Host ""

# Check critical security
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Security Checks" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if JWT secrets match between services
$apiGatewayJWT = (Get-Content "api-gateway\.env" -ErrorAction SilentlyContinue | Select-String -Pattern "^JWT_SECRET\s*=(.*)$").Matches.Groups[1].Value.Trim()
$authServiceJWT = (Get-Content "services\auth-service\.env" -ErrorAction SilentlyContinue | Select-String -Pattern "^JWT_SECRET\s*=(.*)$").Matches.Groups[1].Value.Trim()

if ($apiGatewayJWT -eq $authServiceJWT) {
    Write-Host "  [OK] JWT_SECRET matches between API Gateway and Auth Service" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] JWT_SECRET does NOT match between services!" -ForegroundColor Red
    Write-Host "    API Gateway: $apiGatewayJWT" -ForegroundColor Gray
    Write-Host "    Auth Service: $authServiceJWT" -ForegroundColor Gray
    $allValid = $false
}

# Check if GATEWAY_INTERNAL_SECRET matches
$apiGatewayInternal = (Get-Content "api-gateway\.env" -ErrorAction SilentlyContinue | Select-String -Pattern "^GATEWAY_INTERNAL_SECRET\s*=(.*)$").Matches.Groups[1].Value.Trim()
$authServiceInternal = (Get-Content "services\auth-service\.env" -ErrorAction SilentlyContinue | Select-String -Pattern "^GATEWAY_INTERNAL_SECRET\s*=(.*)$").Matches.Groups[1].Value.Trim()

if ($apiGatewayInternal -eq $authServiceInternal) {
    Write-Host "  [OK] GATEWAY_INTERNAL_SECRET matches between services" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] GATEWAY_INTERNAL_SECRET does NOT match!" -ForegroundColor Red
    Write-Host "    API Gateway: $apiGatewayInternal" -ForegroundColor Gray
    Write-Host "    Auth Service: $authServiceInternal" -ForegroundColor Gray
    $allValid = $false
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($allValid) {
    Write-Host "All critical environment variables are properly configured!" -ForegroundColor Green
} else {
    Write-Host "Some environment variables need attention. Please fix the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  1. Run: .\scripts\setup-env-files.ps1 to create missing .env files" -ForegroundColor White
    Write-Host "  2. Ensure JWT_SECRET is the same in api-gateway and auth-service" -ForegroundColor White
    Write-Host "  3. Ensure GATEWAY_INTERNAL_SECRET is the same in both services" -ForegroundColor White
    Write-Host "  4. Replace placeholder values with real secrets" -ForegroundColor White
}

Write-Host ""
