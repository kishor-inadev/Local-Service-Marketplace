#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Starts all services and runs automated API tests.
.DESCRIPTION
    This orchestrator script:
      1. Starts all services using docker compose
      2. Waits for services to be healthy
      3. Optionally seeds the database with sample data
      4. Runs the Newman test suite
      5. Displays a summary and report location
.PARAMETER SkipStart
    Skip starting services. Assume they are already running.
.PARAMETER SkipSeed
    Skip database seeding even if SkipStart is not used.
.PARAMETER DockerComposeFile
    Path to docker compose.yml file. Default: docker compose.yml
.EXAMPLE
    .\scripts\test-all-services.ps1
    Starts all services, waits for health, runs tests.
.EXAMPLE
    .\scripts\test-all-services.ps1 -SkipStart
    Assumes services are already running, just runs tests.
.NOTES
    This script requires Docker Desktop to be running.
    The default docker compose.yml is at the project root.
#>

[CmdletBinding()]
param(
    [switch]$SkipStart,
    [switch]$SkipSeed,
    [string]$DockerComposeFile = "docker compose.yml"
)

$GatewayPort = $null

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

function Get-GatewayPort {
    param([string]$ComposeFile = "docker compose.yml")

    try {
        $mapping = docker port api-gateway 3000 2>$null | Select-Object -First 1
        if ($LASTEXITCODE -eq 0 -and $mapping -match ':(\d+)$') {
            return $matches[1]
        }
    } catch {
        # Fall back to compose mapping
    }

    try {
        $mapping = docker compose -f $ComposeFile port api-gateway 3000 2>$null | Select-Object -First 1
        if ($LASTEXITCODE -eq 0 -and $mapping -match ':(\d+)$') {
            return $matches[1]
        }
    } catch {
        # Fall back to default
    }

    if ($env:API_GATEWAY_PORT) {
        return $env:API_GATEWAY_PORT
    }

    # Read .env file for API_GATEWAY_PORT
    if (Test-Path ".env") {
        $envLine = Get-Content ".env" | Select-String -Pattern '^API_GATEWAY_PORT=(.+)' | Select-Object -First 1
        if ($envLine -and $envLine.Matches.Groups[1].Value) {
            return $envLine.Matches.Groups[1].Value.Trim()
        }
    }

    return "3800"
}

function Get-RunningComposeServices {
    param([string]$ComposeFile = "docker compose.yml")

    $overrideFile = [System.IO.Path]::ChangeExtension($ComposeFile, $null).TrimEnd('.') + ".override.yml"
    $composeArgs = @("-f", $ComposeFile)

    if (Test-Path $overrideFile) {
        $composeArgs += @("-f", $overrideFile)
    }

    $composeArgs += @("ps", "--services", "--status", "running")

    try {
        $services = & docker compose @composeArgs 2>$null |
            ForEach-Object { $_.Trim() } |
            Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        return @($services)
    } catch {
        return @()
    }
}

function Invoke-HealthRequest {
    param(
        [string]$Uri,
        [int]$TimeoutSec = 8
    )

    try {
        $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec $TimeoutSec
        $json = $null
        try {
            $json = $response.Content | ConvertFrom-Json
        } catch {
            # Ignore JSON parsing issues and return raw content
        }

        return [PSCustomObject]@{
            StatusCode = [int]$response.StatusCode
            Json       = $json
            Raw        = $response.Content
            Error      = $null
        }
    } catch {
        $statusCode = $null
        $rawBody = $null

        if ($_.Exception.Response) {
            try {
                $statusCode = [int]$_.Exception.Response.StatusCode
            } catch {
                $statusCode = $null
            }

            try {
                $stream = $_.Exception.Response.GetResponseStream()
                if ($stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $rawBody = $reader.ReadToEnd()
                    $reader.Close()
                    $stream.Close()
                }
            } catch {
                $rawBody = $null
            }
        }

        $json = $null
        if ($rawBody) {
            try {
                $json = $rawBody | ConvertFrom-Json
            } catch {
                # Ignore JSON parsing issues and return raw content
            }
        }

        return [PSCustomObject]@{
            StatusCode = $statusCode
            Json       = $json
            Raw        = $rawBody
            Error      = $_.Exception.Message
        }
    }
}

function Start-Services {
    Write-Info "Starting all services with docker compose..."
    Write-Info "Using compose file: $DockerComposeFile"

    # Validate compose file exists
    if (-not (Test-Path $DockerComposeFile)) {
        Write-ErrorMsg "Docker Compose file not found: $DockerComposeFile"
        exit 1
    }

    # Start services detached — always include the override file so local DB is used
    $overrideFile = [System.IO.Path]::ChangeExtension($DockerComposeFile, $null).TrimEnd('.') + ".override.yml"
    if (Test-Path $overrideFile) {
        Write-Info "Including override file: $overrideFile"
        docker compose -f $DockerComposeFile -f $overrideFile up -d
    } else {
        docker compose -f $DockerComposeFile up -d
    }

    # Check if services started
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Failed to start services with docker compose."
        exit 1
    }

    $script:GatewayPort = Get-GatewayPort -ComposeFile $DockerComposeFile
    Write-Info "Detected API Gateway host port: $script:GatewayPort"

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
        & $SeederScript -Force
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

    if (-not $script:GatewayPort) {
        $script:GatewayPort = Get-GatewayPort -ComposeFile $DockerComposeFile
    }

    $gatewayHealthUrl = "http://127.0.0.1:$GatewayPort/health"
    $servicesHealthUrl = "http://127.0.0.1:$GatewayPort/health/services"
    $maxWait = 120
    $interval = 5
    $elapsed = 0
    $gatewayHealthy = $false
    $runningComposeServices = Get-RunningComposeServices -ComposeFile $DockerComposeFile
    $runningServiceSet = @{}
    foreach ($svc in $runningComposeServices) {
        $runningServiceSet[$svc] = $true
    }

    if ($runningComposeServices.Count -gt 0) {
        Write-Info "Running compose services: $($runningComposeServices -join ', ')"
    }

    # First, wait for gateway to respond
    while ($elapsed -lt $maxWait) {
        $gatewayResult = Invoke-HealthRequest -Uri $gatewayHealthUrl -TimeoutSec 8
        if ($gatewayResult.Json) {
            $health = $gatewayResult.Json
            $gatewayStatus = $health.status
            if (-not $gatewayStatus -and $health.data) {
                $gatewayStatus = $health.data.status
            }
            if ($gatewayStatus -in @("healthy", "ok", "up", "UP", "degraded", "DEGRADED")) {
                if ($gatewayStatus -in @("degraded", "DEGRADED")) {
                    Write-Warning "API Gateway is reachable with degraded status; continuing to validate downstream services."
                } else {
                    Write-Success "API Gateway is healthy."
                }
                $gatewayHealthy = $true
                break
            }
        }

        Write-Info "Waiting for gateway... ($elapsed/$maxWait s)"
        Start-Sleep -Seconds $interval
        $elapsed += $interval
    }

    if (-not $gatewayHealthy) {
        Write-ErrorMsg "API Gateway did not become healthy within $maxWait seconds."
        Write-ErrorMsg "Check logs: docker compose logs api-gateway"
        exit 1
    }

    # Then wait for all services
    $elapsed = 0
    $allServicesHealthy = $false
    while ($elapsed -lt $maxWait) {
        $servicesResult = Invoke-HealthRequest -Uri $servicesHealthUrl -TimeoutSec 8
        if ($servicesResult.Json) {
            $health = $servicesResult.Json
            $services = $health.services
            if (-not $services -and $health.data) {
                $services = $health.data.services
            }
            if (-not $services) {
                Write-Warning "Services health payload does not include 'services' yet."
                Start-Sleep -Seconds $interval
                $elapsed += $interval
                continue
            }

            $allHealthy = $true
            $unhealthyServices = @()

            foreach ($service in $services.PSObject.Properties) {
                $name = $service.Name
                $status = $service.Value.status
                if ($status -notin @("healthy", "ok", "up", "UP")) {
                    $serviceUrl = [string]$service.Value.url
                    $serviceError = [string]$service.Value.error
                    $serviceHost = $null

                    if ($serviceUrl -match '^https?://([^/:]+)') {
                        $serviceHost = $matches[1]
                    }

                    $isHostNotInCompose = $serviceHost -and (-not $runningServiceSet.ContainsKey($serviceHost))
                    $isDnsLookupError = $serviceError -match 'ENOTFOUND|EAI_AGAIN|getaddrinfo'

                    if ($isHostNotInCompose -and $isDnsLookupError) {
                        Write-Warning "Skipping health gate for '$name' because '$serviceHost' is not running in current compose stack."
                        continue
                    }

                    $allHealthy = $false
                    $unhealthyServices += "$name ($status)"
                }
            }

            if ($allHealthy) {
                Write-Success "All services are healthy!"
                $allServicesHealthy = $true
                return
            } else {
                Write-Warning "Unhealthy services: $($unhealthyServices -join ', ')"
            }
        }

        Write-Info "Waiting for all services... ($elapsed/$maxWait s)"
        Start-Sleep -Seconds $interval
        $elapsed += $interval
    }

    if (-not $allServicesHealthy) {
        Write-ErrorMsg "Services did not become healthy within $maxWait seconds."
        Write-ErrorMsg "Check health: $servicesHealthUrl"
        Write-ErrorMsg "Check logs: docker compose logs"
        exit 1
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

    $baseUrl = "http://127.0.0.1:$GatewayPort/api/v1"
    Write-Info "Using API base URL for Newman: $baseUrl"
    $null = & $testScript -BaseUrl $baseUrl
    $exitCode = [int]$LASTEXITCODE

    return $exitCode
}

function Show-Summary {
    param([int]$ExitCode)

    Write-Info ""
    Write-Info "========================================"
    Write-Info "  Test Run Summary"
    Write-Info "========================================"
    Write-Info ""

    if ($ExitCode -eq 0) {
        Write-Success "✅ ALL TESTS PASSED"
        Write-Info ""
        Write-Info "Platform is fully functional!"
        Write-Info "Next steps:"
        Write-Info "  - Open frontend: http://localhost:3000"
        Write-Info "  - API Gateway: http://localhost:$GatewayPort"
        Write-Info "  - Test reports: test-reports/report_*.html"
    } else {
        Write-ErrorMsg "❌ SOME TESTS FAILED (Exit code: $ExitCode)"
        Write-Info ""
        Write-Info "Troubleshooting:"
        Write-Info "  1. Check the HTML report in test-reports/ for details"
        Write-Info "  2. Check service logs: docker compose logs <service-name>"
        Write-Info "  3. Re-run with verbose output: pnpm test:api:verbose"
        Write-Info "  4. Ensure all services are running: docker compose ps"
    }

    Write-Info ""
}

# MAIN
try {
    Write-Info "========================================"
    Write-Info "  Local Service Marketplace"
    Write-Info "  Full Integration Test Suite"
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
        $script:GatewayPort = Get-GatewayPort -ComposeFile $DockerComposeFile
        Write-Info "Detected API Gateway host port: $script:GatewayPort"
        Write-Warning "Skipping service startup. Assuming services are already running."
        Write-Warning "Verify with: docker compose ps"
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
