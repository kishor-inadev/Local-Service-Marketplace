# Local Service Marketplace - Quick Start Script
# Run this script to start the entire platform

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Local Service Marketplace - Platform Startup            " -ForegroundColor Cyan
Write-Host "   Starting all services...                                " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "[OK] Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

try {
    $composeVersion = docker-compose --version
    Write-Host "[OK] Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker Compose is not installed!" -ForegroundColor Red
    exit 1
}

# Check if .env exists
Write-Host ""
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path .env)) {
    Write-Host "[WARNING] .env file not found, creating from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "[OK] Created .env file" -ForegroundColor Green
    Write-Host "[WARNING] Please update JWT_SECRET in .env for production use!" -ForegroundColor Yellow
} else {
    Write-Host "[OK] .env file exists" -ForegroundColor Green
}

# Parse .env to detect scaling flags
$CACHE_ENABLED = $false
$EVENT_BUS_ENABLED = $false
$EMAIL_ENABLED = $true
$SMS_ENABLED = $false
$FRONTEND_ENABLED = $true
$API_GATEWAY_ENABLED = $true

if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        # Strip comments and whitespace
        $line = $_ -replace '#.*$', ''
        $line = $line.Trim()
        
        if ($line -match "^CACHE_ENABLED=(.+)") {
            $CACHE_ENABLED = $matches[1].Trim() -eq "true"
        }
        if ($line -match "^EVENT_BUS_ENABLED=(.+)") {
            $EVENT_BUS_ENABLED = $matches[1].Trim() -eq "true"
        }
        if ($line -match "^EMAIL_ENABLED=(.+)") {
            $EMAIL_ENABLED = $matches[1].Trim() -eq "true"
        }
        if ($line -match "^SMS_ENABLED=(.+)") {
            $SMS_ENABLED = $matches[1].Trim() -eq "true"
        }
        if ($line -match "^FRONTEND_ENABLED=(.+)") {
            $FRONTEND_ENABLED = $matches[1].Trim() -eq "true"
        }
        if ($line -match "^API_GATEWAY_ENABLED=(.+)") {
            $API_GATEWAY_ENABLED = $matches[1].Trim() -eq "true"
        }
    }
}

# Determine which profiles to use
$profiles = @()
if ($CACHE_ENABLED) {
    $profiles += "cache"
}
if ($EVENT_BUS_ENABLED) {
    $profiles += "events"
}
if ($EMAIL_ENABLED) {
    $profiles += "email"
}
if ($SMS_ENABLED) {
    $profiles += "sms"
}
if ($FRONTEND_ENABLED) {
    $profiles += "frontend"
}
if ($API_GATEWAY_ENABLED -and -not $FRONTEND_ENABLED) {
    # Gateway profile only if frontend is disabled (frontend profile includes gateway)
    $profiles += "gateway"
}

# Display configuration
Write-Host ""
Write-Host "Service Configuration:" -ForegroundColor Cyan
Write-Host "  FRONTEND_ENABLED:   $FRONTEND_ENABLED $(if ($FRONTEND_ENABLED) {'(Frontend + API Gateway)'} else {'(Frontend disabled)'})" -ForegroundColor $(if ($FRONTEND_ENABLED) {'Green'} else {'Gray'})
Write-Host "  API_GATEWAY_ENABLED: $API_GATEWAY_ENABLED $(if ($API_GATEWAY_ENABLED) {'(API Gateway will start)'} else {'(API Gateway disabled)'})" -ForegroundColor $(if ($API_GATEWAY_ENABLED) {'Green'} else {'Gray'})

Write-Host ""
Write-Host "Infrastructure Configuration:" -ForegroundColor Cyan
Write-Host "  CACHE_ENABLED:      $CACHE_ENABLED $(if ($CACHE_ENABLED) {'(Redis will start)'} else {'(Redis disabled)'})" -ForegroundColor $(if ($CACHE_ENABLED) {'Green'} else {'Gray'})
Write-Host "  EVENT_BUS_ENABLED:  $EVENT_BUS_ENABLED $(if ($EVENT_BUS_ENABLED) {'(Kafka will start)'} else {'(Kafka disabled)'})" -ForegroundColor $(if ($EVENT_BUS_ENABLED) {'Green'} else {'Gray'})
Write-Host "  EMAIL_ENABLED:      $EMAIL_ENABLED $(if ($EMAIL_ENABLED) {'(Email service will start)'} else {'(Email disabled)'})" -ForegroundColor $(if ($EMAIL_ENABLED) {'Green'} else {'Gray'})
Write-Host "  SMS_ENABLED:        $SMS_ENABLED $(if ($SMS_ENABLED) {'(SMS service will start)'} else {'(SMS disabled)'})" -ForegroundColor $(if ($SMS_ENABLED) {'Green'} else {'Gray'})

# Determine deployment mode
if (-not $FRONTEND_ENABLED -and -not $API_GATEWAY_ENABLED) {
    Write-Host ""
    Write-Host "  Mode:               Backend Only (Microservices + PostgreSQL)" -ForegroundColor Yellow
} elseif (-not $FRONTEND_ENABLED -and $API_GATEWAY_ENABLED) {
    Write-Host ""
    Write-Host "  Mode:               Backend + API Gateway (No Frontend)" -ForegroundColor Yellow
} elseif ($CACHE_ENABLED -and $EVENT_BUS_ENABLED) {
    Write-Host ""
    Write-Host "  Mode:               Full Stack + Full Scaling" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "  Mode:               Full Stack (MVP Level)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting Docker containers..." -ForegroundColor Yellow
Write-Host "This may take 3-5 minutes on first run (building images)..." -ForegroundColor Gray
Write-Host ""

# Build docker-compose command with profiles
if ($profiles.Count -gt 0) {
    $profileArgs = $profiles | ForEach-Object { "--profile", $_ }
    Write-Host "Starting with profiles: $($profiles -join ', ')" -ForegroundColor Cyan
    docker-compose $profileArgs up -d --build
} else {
    Write-Host "Starting core services only (no scaling infrastructure)" -ForegroundColor Cyan
    docker-compose up -d --build
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] All services started successfully!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Services Status:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host ""
    Write-Host "Access Points:" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Gray
    
    if ($FRONTEND_ENABLED) {
        Write-Host "  Frontend:        http://localhost:3000" -ForegroundColor White
    } else {
        Write-Host "  Frontend:        (disabled)" -ForegroundColor Gray
    }
    
    if ($API_GATEWAY_ENABLED) {
        Write-Host "  API Gateway:     http://localhost:3500" -ForegroundColor White
    } else {
        Write-Host "  API Gateway:     (disabled)" -ForegroundColor Gray
    }
    
    Write-Host "  PostgreSQL:      localhost:5432" -ForegroundColor White
    
    if ($CACHE_ENABLED) {
        Write-Host "  Redis:           localhost:6379" -ForegroundColor White
    } else {
        Write-Host "  Redis:           (disabled)" -ForegroundColor Gray
    }
    
    if ($EVENT_BUS_ENABLED) {
        Write-Host "  Kafka:           localhost:9092" -ForegroundColor White
        Write-Host "  Zookeeper:       localhost:2181" -ForegroundColor White
    } else {
        Write-Host "  Kafka:           (disabled)" -ForegroundColor Gray
    }
    
    if ($EMAIL_ENABLED) {
        Write-Host "  Email Service:   localhost:4000" -ForegroundColor White
        Write-Host "  MongoDB (Email): localhost:27018" -ForegroundColor White
    } else {
        Write-Host "  Email Service:   (disabled)" -ForegroundColor Gray
    }
    
    if ($SMS_ENABLED) {
        Write-Host "  SMS Service:     localhost:5000" -ForegroundColor White
        Write-Host "  MongoDB (SMS):   localhost:27019" -ForegroundColor White
    } else {
        Write-Host "  SMS Service:     (disabled)" -ForegroundColor Gray
    }
    
    if (-not $FRONTEND_ENABLED -and -not $API_GATEWAY_ENABLED) {
        Write-Host ""
        Write-Host "  Microservices:   localhost:3001-3012" -ForegroundColor White
        Write-Host "  (Direct access to backend APIs)" -ForegroundColor Gray
    }
    
    Write-Host "============================================================" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "Useful Commands:" -ForegroundColor Cyan
    Write-Host "  View logs:          docker-compose logs -f" -ForegroundColor Gray
    Write-Host "  Stop services:      docker-compose stop" -ForegroundColor Gray
    Write-Host "  Restart:            docker-compose restart" -ForegroundColor Gray
    Write-Host "  Remove everything:  docker-compose down" -ForegroundColor Gray
    
    # Show configuration help
    $showConfigHelp = $false
    
    if (-not $FRONTEND_ENABLED -or -not $API_GATEWAY_ENABLED) {
        Write-Host ""
        Write-Host "Enable Services:" -ForegroundColor Cyan
        $showConfigHelp = $true
        if (-not $FRONTEND_ENABLED) {
            Write-Host "  Frontend:           Edit .env set FRONTEND_ENABLED=true" -ForegroundColor Gray
        }
        if (-not $API_GATEWAY_ENABLED) {
            Write-Host "  API Gateway:        Edit .env set API_GATEWAY_ENABLED=true" -ForegroundColor Gray
        }
    }
    
    if (-not $CACHE_ENABLED -or -not $EVENT_BUS_ENABLED -or -not $EMAIL_ENABLED -or -not $SMS_ENABLED) {
        if (-not $showConfigHelp) {
            Write-Host ""
        }
        Write-Host "Enable Scaling:" -ForegroundColor Cyan
        $showConfigHelp = $true
        if (-not $CACHE_ENABLED) {
            Write-Host "  Redis caching:      Edit .env set CACHE_ENABLED=true" -ForegroundColor Gray
        }
        if (-not $EVENT_BUS_ENABLED) {
            Write-Host "  Kafka events:       Edit .env set EVENT_BUS_ENABLED=true" -ForegroundColor Gray
        }
        if (-not $EMAIL_ENABLED) {
            Write-Host "  Email service:      Edit .env set EMAIL_ENABLED=true" -ForegroundColor Gray
        }
        if (-not $SMS_ENABLED) {
            Write-Host "  SMS service:        Edit .env set SMS_ENABLED=true" -ForegroundColor Gray
        }
    }
    
    if ($showConfigHelp) {
        Write-Host "  Then restart:       .\scripts\start.ps1" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "[INFO] Services are starting up (health checks running)..." -ForegroundColor Yellow
    Write-Host "Wait 30-60 seconds for all services to be healthy." -ForegroundColor Gray
    
    Write-Host ""
    
    if ($FRONTEND_ENABLED) {
        Write-Host "[READY] Open http://localhost:3000 in your browser" -ForegroundColor Green
        
        # Ask if user wants to open browser
        Write-Host ""
        $openBrowser = Read-Host "Open browser now? (Y/N)"
        if ($openBrowser -eq "Y" -or $openBrowser -eq "y") {
            Start-Process "http://localhost:3000"
        }
    } elseif ($API_GATEWAY_ENABLED) {
        Write-Host "[READY] Backend running - API Gateway: http://localhost:3500" -ForegroundColor Green
    } else {
        Write-Host "[READY] Backend microservices running on ports 3001-3012" -ForegroundColor Green
    }
    
    # Ask if user wants to view logs
    Write-Host ""
    $viewLogs = Read-Host "View live logs? (Y/N)"
    if ($viewLogs -eq "Y" -or $viewLogs -eq "y") {
        Write-Host ""
        Write-Host "[LOGS] Streaming logs (Press Ctrl+C to stop)..." -ForegroundColor Cyan
        docker-compose logs -f
    }
    
} else {
    Write-Host ""
    Write-Host "[ERROR] Failed to start services!" -ForegroundColor Red
    Write-Host "Check the error messages above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Try running: docker-compose logs" -ForegroundColor Yellow
    exit 1
}
