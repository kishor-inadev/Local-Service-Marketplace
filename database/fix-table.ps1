#!/usr/bin/env pwsh
# Quick fix for missing provider_services table

Write-Host "Fixing missing provider_services table..." -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}
elseif (Test-Path "../.env") {
    Get-Content "../.env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

$host = $env:POSTGRES_HOST ?? "localhost"
$port = $env:POSTGRES_PORT ?? "5432"
$user = $env:POSTGRES_USER ?? "postgres"
$db = $env:POSTGRES_DB ?? "marketplace"

Write-Host "Applying fix to database: $db" -ForegroundColor Yellow
Write-Host ""

$env:PGPASSWORD = $env:POSTGRES_PASSWORD

try {
    $scriptPath = "database\fix-missing-table.sql"
    if (-not (Test-Path $scriptPath)) {
        $scriptPath = "fix-missing-table.sql"
    }

    psql -h $host -p $port -U $user -d $db -f $scriptPath

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Success! Table created." -ForegroundColor Green
        Write-Host ""
        Write-Host "Now run: .\scripts\run-seeder.ps1" -ForegroundColor Cyan
    }
    else {
        Write-Host ""
        Write-Host "Failed to create table. See error above." -ForegroundColor Red
    }
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
