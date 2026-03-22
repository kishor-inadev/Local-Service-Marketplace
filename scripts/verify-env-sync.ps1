# ===============================================
# Environment Variables Synchronization Checker
# Local Service Marketplace
# ===============================================

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Environment Variables Sync Checker" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
$warnings = @()

# ===============================================
# 1. Check Critical Secrets Files
# ===============================================

Write-Host "[1] Checking critical secrets files..." -ForegroundColor Yellow

$requiredFiles = @(
    "docker.env",
    "secrets.env",
    "api-gateway/.env.example",
    "services/auth-service/.env.example"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $issues += "❌ Missing file: $file"
    } else {
        Write-Host "  ✅ Found: $file" -ForegroundColor Green
    }
}

# ===============================================
# 2. Check Critical Environment Variables
# ===============================================

Write-Host ""
Write-Host "[2] Checking critical environment variables..." -ForegroundColor Yellow

function Get-EnvVars {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        return @{}
    }
    
    $vars = @{}
    $content = Get-Content $FilePath -ErrorAction SilentlyContinue
    
    foreach ($line in $content) {
        if ($line -match '^([A-Z_][A-Z0-9_]*)=(.*)$') {
            $vars[$matches[1]] = $matches[2]
        }
    }
    
    return $vars
}

# Critical variables that MUST be synchronized
$criticalVars = @(
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "GATEWAY_INTERNAL_SECRET",
    "DATABASE_PASSWORD"
)

Write-Host ""
Write-Host "  Checking docker.env vs secrets.env..." -ForegroundColor Cyan

$dockerEnv = Get-EnvVars "docker.env"
$secretsEnv = Get-EnvVars "secrets.env"

foreach ($var in $criticalVars) {
    Write-Host "    Checking: $var" -ForegroundColor Gray
    
    # Check if exists in docker.env
    if (-not $dockerEnv.ContainsKey($var)) {
        $issues += "❌ Missing in docker.env: $var"
    }
    
    # Check if exists in secrets.env
    if (-not $secretsEnv.ContainsKey($var)) {
        $issues += "❌ Missing in secrets.env: $var"
    }
    
    # Check if values match
    if ($dockerEnv.ContainsKey($var) -and $secretsEnv.ContainsKey($var)) {
        if ($dockerEnv[$var] -ne $secretsEnv[$var]) {
            $issues += "❌ Mismatch: $var differs between docker.env and secrets.env"
        } else {
            Write-Host "      ✅ Synchronized" -ForegroundColor Green
        }
    }
}

# ===============================================
# 3. Check docker-compose.yml Environment Variables
# ===============================================

Write-Host ""
Write-Host "[3] Checking docker-compose.yml..." -ForegroundColor Yellow

$composeContent = Get-Content "docker-compose.yml" -Raw

# Check auth-service
Write-Host "  Checking auth-service..." -ForegroundColor Cyan
$requiredAuthVars = @("JWT_SECRET", "JWT_REFRESH_SECRET", "GATEWAY_INTERNAL_SECRET", "JWT_EXPIRES_IN", "JWT_REFRESH_EXPIRATION")

foreach ($var in $requiredAuthVars) {
    if ($composeContent -match "auth-service[\s\S]*?- $var=") {
        Write-Host "    ✅ $var configured" -ForegroundColor Green
    } else {
        $issues += "❌ auth-service missing environment variable: $var"
    }
}

# Check api-gateway
Write-Host "  Checking api-gateway..." -ForegroundColor Cyan
$requiredGatewayVars = @("JWT_SECRET", "GATEWAY_INTERNAL_SECRET", "TOKEN_VALIDATION_STRATEGY")

foreach ($var in $requiredGatewayVars) {
    if ($composeContent -match "api-gateway[\s\S]*?- $var=") {
        Write-Host "    ✅ $var configured" -ForegroundColor Green
    } else {
        $issues += "❌ api-gateway missing environment variable: $var"
    }
}

# ===============================================
# 4. Check Service .env.example Files
# ===============================================

Write-Host ""
Write-Host "[4] Checking service .env.example files..." -ForegroundColor Yellow

$postgresServices = @(
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

$mongoServices = @(
    "email-service",
    "sms-service"
)

# Expected ports for each service
$expectedPorts = @{
    "auth-service" = 3001
    "user-service" = 3002
    "request-service" = 3003
    "proposal-service" = 3004
    "job-service" = 3005
    "payment-service" = 3006
    "messaging-service" = 3007
    "notification-service" = 3008
    "review-service" = 3009
    "admin-service" = 3010
    "analytics-service" = 3011
    "infrastructure-service" = 3012
    "email-service" = 3500
    "sms-service" = 3000
}

# Check PostgreSQL services
foreach ($service in $postgresServices) {
    $envExamplePath = "services/$service/.env.example"
    
    if (Test-Path $envExamplePath) {
        Write-Host "  Checking $service..." -ForegroundColor Cyan
        
        $serviceEnv = Get-EnvVars $envExamplePath
        
        # Check for required database variables
        $requiredDbVars = @("DATABASE_HOST", "DATABASE_PORT", "DATABASE_USER", "DATABASE_PASSWORD", "DATABASE_NAME", "DATABASE_URL")
        
        $missingVars = @()
        foreach ($dbVar in $requiredDbVars) {
            if (-not $serviceEnv.ContainsKey($dbVar)) {
                $missingVars += $dbVar
            }
        }
        
        if ($missingVars.Count -eq 0) {
            Write-Host "    ✅ Database variables complete" -ForegroundColor Green
        } else {
            foreach ($var in $missingVars) {
                $warnings += "⚠️  $service missing: $var"
            }
        }
        
        # Check port number
        if ($serviceEnv.ContainsKey("PORT")) {
            $actualPort = $serviceEnv["PORT"]
            $expectedPort = $expectedPorts[$service]
            if ($actualPort -eq $expectedPort) {
                Write-Host "    ✅ Port $actualPort configured correctly" -ForegroundColor Green
            } else {
                $warnings += "⚠️  $service has port $actualPort, expected $expectedPort"
            }
        }
        
        # Auth service should have JWT vars
        if ($service -eq "auth-service") {
            $requiredJwtVars = @("JWT_SECRET", "JWT_REFRESH_SECRET", "GATEWAY_INTERNAL_SECRET", "JWT_EXPIRES_IN", "JWT_REFRESH_EXPIRATION")
            
            foreach ($jwtVar in $requiredJwtVars) {
                if (-not $serviceEnv.ContainsKey($jwtVar)) {
                    $issues += "❌ auth-service .env.example missing: $jwtVar"
                }
            }
        }
        
    } else {
        $issues += "❌ Missing .env.example for: $service"
    }
}

# Check MongoDB services
foreach ($service in $mongoServices) {
    $envExamplePath = "services/$service/.env.example"
    
    if (Test-Path $envExamplePath) {
        Write-Host "  Checking $service (MongoDB)..." -ForegroundColor Cyan
        
        $serviceEnv = Get-EnvVars $envExamplePath
        
        # Check for MongoDB variables
        if ($service -eq "email-service") {
            if ($serviceEnv.ContainsKey("MONGO_URL")) {
                Write-Host "    ✅ MongoDB configuration present" -ForegroundColor Green
            } else {
                $warnings += "⚠️  $service missing: MONGO_URL"
            }
        } elseif ($service -eq "sms-service") {
            if ($serviceEnv.ContainsKey("MONGODB_URI")) {
                Write-Host "    ✅ MongoDB configuration present" -ForegroundColor Green
            } else {
                $warnings += "⚠️  $service missing: MONGODB_URI"
            }
        }
        
    } else {
        $issues += "❌ Missing .env.example for: $service"
    }
}

# ===============================================
# 5. Check API Gateway .env.example
# ===============================================

Write-Host ""
Write-Host "[5] Checking API Gateway configuration..." -ForegroundColor Yellow

$gatewayEnvPath = "api-gateway/.env.example"
if (Test-Path $gatewayEnvPath) {
    $gatewayEnv = Get-EnvVars $gatewayEnvPath
    
    $requiredGatewayEnvVars = @(
        "JWT_SECRET",
        "GATEWAY_INTERNAL_SECRET",
        "TOKEN_VALIDATION_STRATEGY",
        "AUTH_SERVICE_URL",
        "USER_SERVICE_URL",
        "REQUEST_SERVICE_URL",
        "PROPOSAL_SERVICE_URL",
        "JOB_SERVICE_URL",
        "PAYMENT_SERVICE_URL",
        "NOTIFICATION_SERVICE_URL",
        "REVIEW_SERVICE_URL",
        "ADMIN_SERVICE_URL"
    )
    
    foreach ($var in $requiredGatewayEnvVars) {
        if ($gatewayEnv.ContainsKey($var)) {
            Write-Host "  ✅ $var configured" -ForegroundColor Green
        } else {
            $issues += "❌ api-gateway/.env.example missing: $var"
        }
    }
}

# ===============================================
# 6. Check Frontend .env.example
# ===============================================

Write-Host ""
Write-Host "[6] Checking Frontend configuration..." -ForegroundColor Yellow

$frontendEnvPath = "frontend/.env.example"
if (Test-Path $frontendEnvPath) {
    $frontendEnv = Get-EnvVars $frontendEnvPath
    
    $requiredFrontendVars = @(
        "NEXT_PUBLIC_API_URL",
        "AUTH_SECRET",
        "NEXTAUTH_URL"
    )
    
    foreach ($var in $requiredFrontendVars) {
        if ($frontendEnv.ContainsKey($var)) {
            Write-Host "  ✅ $var configured" -ForegroundColor Green
        } else {
            $issues += "❌ frontend/.env.example missing: $var"
        }
    }
    
    # Check if AUTH_SECRET has a placeholder value
    if ($frontendEnv["AUTH_SECRET"] -match "change|production|secret_here") {
        $warnings += "⚠️  Frontend AUTH_SECRET should be updated for production"
    }
}

# ===============================================
# 7. Check Service Communication Dependencies
# ===============================================

Write-Host ""
Write-Host "[7] Checking service communication dependencies..." -ForegroundColor Yellow

$serviceDependencies = @{
    "auth-service" = @("NOTIFICATION_SERVICE_URL")
    "proposal-service" = @("NOTIFICATION_SERVICE_URL")
    "job-service" = @("NOTIFICATION_SERVICE_URL")
    "payment-service" = @("NOTIFICATION_SERVICE_URL")
    "review-service" = @("NOTIFICATION_SERVICE_URL")
    "request-service" = @("USER_SERVICE_URL", "AUTH_SERVICE_URL")
    "notification-service" = @("EMAIL_SERVICE_URL", "SMS_SERVICE_URL")
}

foreach ($service in $serviceDependencies.Keys) {
    $envPath = "services/$service/.env.example"
    if (Test-Path $envPath) {
        $serviceEnv = Get-EnvVars $envPath
        $requiredUrls = $serviceDependencies[$service]
        
        foreach ($url in $requiredUrls) {
            if ($serviceEnv.ContainsKey($url)) {
                Write-Host "  ✅ $service has $url" -ForegroundColor Green
            } else {
                $warnings += "⚠️  $service missing service URL: $url"
            }
        }
    }
}

# ===============================================
# 8. Port Uniqueness Check
# ===============================================

Write-Host ""
Write-Host "[8] Checking port uniqueness..." -ForegroundColor Yellow

$usedPorts = @{}
$allServices = $postgresServices + $mongoServices

foreach ($service in $allServices) {
    $envPath = "services/$service/.env.example"
    if (Test-Path $envPath) {
        $serviceEnv = Get-EnvVars $envPath
        if ($serviceEnv.ContainsKey("PORT")) {
            $port = $serviceEnv["PORT"]
            if ($usedPorts.ContainsKey($port)) {
                $issues += "❌ Port conflict: $service and $($usedPorts[$port]) both use port $port"
            } else {
                $usedPorts[$port] = $service
            }
        }
    }
}

if ($usedPorts.Count -gt 0) {
    Write-Host "  ✅ All service ports are unique" -ForegroundColor Green
}

# ===============================================
# 7. Final Report
# ===============================================

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Verification Results" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ All environment variables are properly synchronized!" -ForegroundColor Green
    Write-Host "✅ All services properly configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services validated:" -ForegroundColor Cyan
    Write-Host "  - 12 NestJS microservices (PostgreSQL)" -ForegroundColor Gray
    Write-Host "  - 2 Express services (MongoDB)" -ForegroundColor Gray
    Write-Host "  - 1 API Gateway" -ForegroundColor Gray
    Write-Host "  - 1 Frontend (Next.js)" -ForegroundColor Gray
    Write-Host ""
    exit 0
} else {
    Write-Host ""
    
    if ($issues.Count -gt 0) {
        Write-Host "Critical Issues Found: $($issues.Count)" -ForegroundColor Red
        Write-Host ""
        foreach ($issue in $issues) {
            Write-Host $issue -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "Warnings: $($warnings.Count)" -ForegroundColor Yellow
        Write-Host ""
        foreach ($warning in $warnings) {
            Write-Host $warning -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    if ($issues.Count -gt 0) {
        Write-Host "Please fix the critical issues above before deploying." -ForegroundColor Red
    } elseif ($warnings.Count -eq 1 -and $warnings[0] -match "Frontend AUTH_SECRET") {
        Write-Host "Only minor warning about production secrets - safe for development." -ForegroundColor Yellow
    }
    Write-Host ""
    
    # Exit with error only if there are critical issues
    if ($issues.Count -gt 0) {
        exit 1
    } else {
        exit 0
    }
}
