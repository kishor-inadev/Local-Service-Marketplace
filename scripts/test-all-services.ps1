#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Starts all services and runs automated API tests.
.DESCRIPTION
    This orchestrator script:
      1. Starts all services using docker-compose
      2. Waits for services to be healthy
      3. Optionally seeds the database with sample data
      4. Runs the Newman test suite
      5. Displays a summary and report location
.PARAMETER SkipStart
    Skip starting services. Assume they are already running.
.PARAMETER SkipSeed
    Skip database seeding even if SkipStart is not used.
.PARAMETER DockerComposeFile
    Path to docker-compose.yml file. Default: docker-compose.yml
.EXAMPLE
    .\scripts\test-all-services.ps1
    Starts all services, waits for health, runs tests.
.EXAMPLE
    .\scripts\test-all-services.ps1 -SkipStart
    Assumes services are already running, just runs tests.
.NOTES
    This script requires Docker Desktop to be running.
    The default docker-compose.yml is at the project root.
#>

[CmdletBinding()]
param(
    [switch]$SkipStart,
    [switch]$SkipSeed,
    [string]$DockerComposeFile = "docker-compose.yml"
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors
$ColorInfo = "Cyan"
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor $ColorInfo
}

function Write-Success {
    param([string]$Message)
    Write-Host $Message -ForegroundColor $ColorSuccess
}

function Write-Warning {
    param([string]$Message)
    Write-Host $Message -ForegroundColor $ColorWarning
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host $Message -ForegroundColor $ColorError
}

function Test-DockerRunning {
    Write-Info "Checking if Docker is running..."
    try {
        $dockerVersion = docker --version
        Write-Success "Docker found: $dockerVersion"
        return $true
    } catch {
        Write-ErrorMsg "Docker is not running or not installed!"
        Write-ErrorMsg "Please start Docker Desktop and try again."
        return $false
    }
}

function Start-Services {
    Write-Info "Starting all services with docker-compose..."
    Write-Info "Using compose file: $DockerComposeFile"

    # Validate compose file exists
    if (-not (Test-Path $DockerComposeFile)) {
        Write-ErrorMsg "Docker Compose file not found: $DockerComposeFile"
        exit 1
    }

    # Start services detached
    docker-compose -f $DockerComposeFile up -d

    # Check if services started
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Failed to start services with docker-compose."
        exit 1
    }

    Write-Success "All services started."
}

function Seed-Database {
    param([string]$SeederScript = "scripts/seed-database.ps1")

    if (-not (Test-Path $SeederScript)) {
        Write-Warning "Seeder script not found: $SeederScript - skipping"
        return
    }

    Write-Info "Seeding database with sample data..."
    Write-Warning "This may take a minute..."

    try {
        & $SeederScript
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database seeded successfully."
        } else {
            Write-Warning "Seeder exited with code $LASTEXITCODE. Some data may not have been inserted."
        }
    } catch {
        Write-Warning "Failed to run seeder: $_"
    }
}

function Wait-ForServices {
    Write-Info "Waiting for services to be healthy..."

    $gatewayHealthUrl = "http://localhost:3500/health"
    $servicesHealthUrl = "http://localhost:3500/health/services"
    $maxWait = 120
    $interval = 5
    $elapsed = 0

    # First, wait for gateway to respond
    while ($elapsed -lt $maxWait) {
        try {
            $response = Invoke-WebRequest -Uri $gatewayHealthUrl -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                $health = $response.Content | ConvertFrom-Json
                if ($health.status -eq "healthy") {
                    Write-Success "API Gateway is healthy."
                    break
                }
            }
        } catch {
            # Not ready yet
        }

        if ($elapsed -ge $maxWait) {
            Write-ErrorMsg "API Gateway did not become healthy within $maxWait seconds."
            Write-ErrorMsg "Check logs: docker-compose logs api-gateway"
            exit 1
        }

        Write-Info "Waiting for gateway... ($elapsed/$maxWait s)"
        Start-Sleep -Seconds $interval
        $elapsed += $interval
    }

    # Then wait for all services
    $elapsed = 0
    while ($elapsed -lt $maxWait) {
        try {
            $response = Invoke-WebRequest -Uri $servicesHealthUrl -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                $health = $response.Content | ConvertFrom-Json
                $allHealthy = $true
                $ unhealthyServices = @()

                foreach ($service in $health.services.PSObject.Properties) {
                    $name = $service.Name
                    $status = $service.Value.status
                    if ($status -ne "healthy") {
                        $allHealthy = $false
                        $unhealthyServices += "$name ($status)"
                    }
                }

                if ($allHealthy) {
                    Write-Success "All services are healthy!"
                    return
                } else {
                    Write-Warning "Unhealthy services: $($unhealthyServices -join ', ')"
                }
            }
        } catch {
            # Not ready yet
        }

        if ($elapsed -ge $maxWait) {
            Write-ErrorMsg "Services did not become healthy within $maxWait seconds."
            Write-ErrorMsg "Check health: $servicesHealthUrl"
            Write-ErrorMsg "Check logs: docker-compose logs"
            exit 1
        }

        Write-Info "Waiting for all services... ($elapsed/$maxWait s)"
        Start-Sleep -Seconds $interval
        $elapsed += $interval
    }
}

function Run-Tests {
    Write-Info "Starting automated tests..."
    Write-Info ""

    # Call the test runner script
    $testScript = "scripts/run-postman-tests.ps1"
    if (-not (Test-Path $testScript)) {
        Write-ErrorMsg "Test runner not found: $testScript"
        exit 1
    }

    & $testScript
    $exitCode = $LASTEXITCODE

    return $exitCode
}

function Show-Summary {
    param([int]$ExitCode)

    Write-Info ""
    Write-Info "========================================"
    Write-Info "  Test Run Summary" -ForegroundColor Cyan
    Write-Info "========================================"
    Write-Info ""

    if ($ExitCode -eq 0) {
        Write-Success "✅ ALL TESTS PASSED"
        Write-Info ""
        Write-Info "Platform is fully functional!"
        Write-Info "Next steps:"
        Write-Info "  - Open frontend: http://localhost:3000"
        Write-Info "  - API Gateway: http://localhost:3500"
        Write-Info "  - Test reports: test-reports/report_*.html"
    } else {
        Write-ErrorMsg "❌ SOME TESTS FAILED (Exit code: $ExitCode)"
        Write-Info ""
        Write-Info "Troubleshooting:"
        Write-Info "  1. Check the HTML report in test-reports/ for details"
        Write-Info "  2. Check service logs: docker-compose logs <service-name>"
        Write-Info "  3. Re-run with verbose output: pnpm test:api:verbose"
        Write-Info "  4. Ensure all services are running: docker-compose ps"
    }

    Write-Info ""
}

# MAIN
try {
    Write-Info "========================================"
    Write-Info "  Local Service Marketplace" -ForegroundColor Cyan
    Write-Info "  Full Integration Test Suite" -ForegroundColor Cyan
    Write-Info "========================================"
    Write-Info ""

    # Check Docker
    if (-not (Test-DockerRunning)) {
        exit 1
    }

    # Start services unless skipping
    if (-not $SkipStart) {
        Start-Services
        Wait-ForServices

        # Seed database unless skipping
        if (-not $SkipSeed) {
            Seed-Database
        }
    } else {
        Write-Warning "Skipping service startup. Assuming services are already running."
        Write-Warning "Verify with: docker-compose ps"
        Write-Info ""
    }

    # Run tests
    $testExitCode = Run-Tests

    # Show summary
    Show-Summary -ExitCode $testExitCode

    exit $testExitCode
}
catch {
    Write-ErrorMsg "Unexpected error: $_"
    exit 1
}
