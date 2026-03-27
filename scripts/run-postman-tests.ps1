#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Runs automated API tests using Newman (Postman CLI) against the Local Service Marketplace.
.DESCRIPTION
    This script executes the Postman collection with Newman, running all test assertions
    and generating reports in HTML, JSON, and CLI formats.
.PARAMETER CollectionPath
    Path to the Postman collection JSON file. Default: docs/Local-Service-Marketplace.postman_collection.json
.PARAMETER EnvironmentPath
    Path to the Newman environment JSON file. Default: newman/newman.env.json
.PARAMETER OutputDir
    Directory to save test reports. Default: test-reports
.PARAMETER WaitForServices
    If specified, the script will wait for all services to be healthy before running tests.
    Uses the health check endpoints to verify availability.
.PARAMETER BaseUrl
    Override the base URL. Useful for testing against different environments.
.EXAMPLE
    .\scripts\run-postman-tests.ps1
    Runs tests with default settings.
.EXAMPLE
    .\scripts\run-postman-tests.ps1 -WaitForServices
    Waits for all services to be healthy, then runs tests.
.EXAMPLE
    .\scripts\run-postman-tests.ps1 -BaseUrl "http://localhost:3000"
    Overrides the base URL for testing.
.NOTES
    Exit codes:
        0 - All tests passed
        1 - One or more tests failed
        2 - Newman not found
        3 - Services not healthy (if -WaitForServices used)
#>

[CmdletBinding()]
param(
    [string]$CollectionPath = "docs/Local-Service-Marketplace.postman_collection.json",
    [string]$EnvironmentPath = "newman/newman.env.json",
    [string]$OutputDir = "test-reports",
    [switch]$WaitForServices,
    [string]$BaseUrl
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Constants
$GATEWAY_HEALTH_URL = "http://localhost:3500/health"
$SERVICES_HEALTH_URL = "http://localhost:3500/health/services"
$MAX_WAIT_SECONDS = 120
$WAIT_INTERVAL = 5

# Colors for output
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

function Test-NewmanInstalled {
    Write-Info "Checking if Newman is installed..."
    try {
        $newmanVersion = pnpm newman --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Newman found: $newmanVersion"
            return $true
        }
    } catch {}

    try {
        $newmanVersion = newman --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Newman found: $newmanVersion"
            return $true
        }
    } catch {}

    Write-ErrorMsg "Newman is not installed. Please run 'pnpm install' in the project root."
    return $false
}

function Test-FilesExist {
    Write-Info "Validating required files..."
    $errors = @()

    if (-not (Test-Path $CollectionPath)) {
        $errors += "Collection file not found: $CollectionPath"
    }

    if (-not (Test-Path $EnvironmentPath)) {
        $errors += "Environment file not found: $EnvironmentPath"
    }

    if ($errors.Count -gt 0) {
        foreach ($error in $errors) {
            Write-ErrorMsg $error
        }
        return $false
    }

    Write-Success "All required files exist."
    return $true
}

function Wait-ForServices {
    Write-Info "Waiting for all services to become healthy..."
    Write-Info "Maximum wait time: $MAX_WAIT_SECONDS seconds"

    $elapsed = 0
    while ($elapsed -lt $MAX_WAIT_SECONDS) {
        try {
            $response = Invoke-WebRequest -Uri $SERVICES_HEALTH_URL -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                $health = $response.Content | ConvertFrom-Json
                $allHealthy = $true
                foreach ($service in $health.services.PSObject.Properties) {
                    $name = $service.Name
                    $status = $service.Value.status
                    if ($status -ne "healthy") {
                        Write-Warning "Service '$name' status: $status"
                        $allHealthy = $false
                    }
                }

                if ($allHealthy) {
                    Write-Success "All services are healthy!"
                    return $true
                }
            }
        } catch {
            # Services not ready yet
        }

        Start-Sleep -Seconds $WAIT_INTERVAL
        $elapsed += $WAIT_INTERVAL
        Write-Info "Still waiting... ($elapsed/$MAX_WAIT_SECONDS s)"
    }

    Write-ErrorMsg "Services did not become healthy within $MAX_WAIT_SECONDS seconds."
    Write-ErrorMsg "Check docker-compose logs for details."
    return $false
}

function Ensure-OutputDir {
    if (-not (Test-Path $OutputDir)) {
        Write-Info "Creating output directory: $OutputDir"
        New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    }
}

function Get-TimestampedFilename {
    param([string]$Extension)
    $timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
    return "report_$timestamp$Extension"
}

function Run-Newman {
    Write-Info "Running Newman tests..."
    Write-Info "Collection: $CollectionPath"
    Write-Info "Environment: $EnvironmentPath"

    # Prepare output paths
    Ensure-OutputDir
    $htmlReport = Join-Path $OutputDir (Get-TimestampedFilename ".html")
    $jsonReport = Join-Path $OutputDir (Get-TimestampedFilename ".json")

    Write-Info "HTML Report: $htmlReport"
    Write-Info "JSON Report: $jsonReport"
    Write-Info ""

    # Build Newman arguments
    $newmanArgs = @(
        "run", $CollectionPath,
        "--environment", $EnvironmentPath,
        "--reporters", "cli,html,json",
        "--reporter-html-export", $htmlReport,
        "--reporter-json-export", $jsonReport,
        "--no-color"
    )

    if ($BaseUrl) {
        $newmanArgs += "--global-var"
        $newmanArgs += "base_url=$BaseUrl"
        Write-Info "Using overridden base URL: $BaseUrl"
    }

    Write-Info "Executing: pnpm newman $($newmanArgs -join ' ')"
    Write-Info "--------------------------------------------------"
    Write-Info ""

    # Run Newman via pnpm
    $env:PNPM_HOME = "$env:APPDATA\pnpm"  # Ensure pnpm is in PATH
    $processInfo = Start-Process -FilePath "pnpm" -ArgumentList $newmanArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput "stdout.txt" -RedirectStandardError "stderr.txt"

    # Capture and display output
    $stdout = Get-Content "stdout.txt" -Raw
    $stderr = Get-Content "stderr.txt" -Raw

    if ($stdout) {
        Write-Host $stdout
    }
    if ($stderr) {
        Write-ErrorMsg $stderr
    }

    # Cleanup temp files
    Remove-Item "stdout.txt","stderr.txt" -ErrorAction SilentlyContinue

    Write-Info ""
    Write-Info "--------------------------------------------------"

    # Check exit code
    if ($processInfo.ExitCode -eq 0) {
        Write-Success "✅ All tests passed!"
        Write-Success "HTML Report: $htmlReport"
        Write-Info "Open the HTML report in your browser to see detailed results."
        return 0
    } else {
        Write-ErrorMsg "❌ Some tests failed. Exit code: $($processInfo.ExitCode)"
        Write-ErrorMsg "HTML Report: $htmlReport"
        Write-Info "Review the report above or open the HTML file to see details."
        return $processInfo.ExitCode
    }
}

# MAIN SCRIPT
try {
    Write-Info "========================================"
    Write-Info "  Postman/Newman Test Runner" -ForegroundColor Cyan
    Write-Info "========================================"
    Write-Info ""

    # Check Newman
    if (-not (Test-NewmanInstalled)) {
        exit 2
    }

    # Check files
    if (-not (Test-FilesExist)) {
        exit 1
    }

    # Optionally override base URL in environment file
    if ($BaseUrl) {
        Write-Info "Overriding base_url to: $BaseUrl"
        $envContent = Get-Content $EnvironmentPath | ConvertFrom-Json
        foreach ($value in $envContent.values) {
            if ($value.key -eq "base_url") {
                $value.value = $BaseUrl
            }
        }
        $envContent | ConvertTo-Json -Depth 10 | Set-Content $EnvironmentPath
    }

    # Wait for services if requested
    if ($WaitForServices) {
        if (-not (Wait-ForServices)) {
            exit 3
        }
    } else {
        Write-Warning "Skipping service health check. Use -WaitForServices to wait for services."
        Write-Warning "Ensure all services are running: docker-compose up -d"
        Write-Info ""
    }

    # Run tests
    $exitCode = Run-Newman
    exit $exitCode
}
catch {
    Write-ErrorMsg "Unexpected error: $_"
    exit 1
}
