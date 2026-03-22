#!/usr/bin/env pwsh
# Recreate PostgreSQL Database in Docker
# This will completely delete and recreate the database

param(
    [switch]$Force,
    [switch]$SkipSeed,
    [switch]$Help
)

# Color functions
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

if ($Help) {
    Write-Info "Database Recreation Script"
    Write-Host ""
    Write-Host "This script will:"
    Write-Host "  1. Stop and remove existing database container"
    Write-Host "  2. Remove database volume (deletes all data)"
    Write-Host "  3. Start new database container"
    Write-Host "  4. Wait for database to be ready"
    Write-Host "  5. Apply schema"
    Write-Host "  6. Run seeder (optional)"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Force      Skip confirmation prompt"
    Write-Host "  -SkipSeed   Don't run seeder after recreation"
    Write-Host "  -Help       Show this help"
    Write-Host ""
    exit 0
}

Write-Info "=================================================="
Write-Info "    PostgreSQL Database Recreation Script        "
Write-Info "=================================================="
Write-Host ""

# Load environment variables
Write-Info "Loading environment variables..."
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
    Write-Success "   Environment variables loaded"
}
else {
    Write-Warning "   No .env file found, using defaults"
}

# Get configuration
$containerName = $env:POSTGRES_CONTAINER ?? "marketplace-postgres"
$volumeName = "local-service-marketplace_postgres_data"
$dbName = $env:POSTGRES_DB ?? "marketplace"
$dbUser = $env:POSTGRES_USER ?? "postgres"
$dbPassword = $env:POSTGRES_PASSWORD ?? "postgres"
$dbPort = $env:POSTGRES_PORT ?? "5432"

Write-Host ""
Write-Info "Configuration:"
Write-Host "   Container: $containerName"
Write-Host "   Database:  $dbName"
Write-Host "   User:      $dbUser"
Write-Host "   Port:      $dbPort"
Write-Host ""

# Warning
if (-not $Force) {
    Write-Warning "WARNING: This will completely delete all data in the database!"
    Write-Host ""
    $response = Read-Host "Are you sure you want to continue? (yes/no)"
    if ($response -ne 'yes') {
        Write-Info "Cancelled."
        exit 0
    }
    Write-Host ""
}

Write-Info "=================================================="
Write-Info "           STEP 1: Stopping Container             "
Write-Info "=================================================="
Write-Host ""

# Check if container exists
$containerExists = docker ps -a --filter "name=$containerName" --format "{{.Names}}" 2>$null

if ($containerExists) {
    Write-Info "Stopping container: $containerName..."
    docker stop $containerName 2>$null
    
    Write-Info "Removing container: $containerName..."
    docker rm $containerName 2>$null
    
    Write-Success "   Container removed"
}
else {
    Write-Info "   Container doesn't exist, skipping"
}

Write-Host ""
Write-Info "=================================================="
Write-Info "           STEP 2: Removing Volume                "
Write-Info "=================================================="
Write-Host ""

# Check if volume exists
$volumeExists = docker volume ls --filter "name=$volumeName" --format "{{.Name}}" 2>$null

if ($volumeExists) {
    Write-Info "Removing volume: $volumeName..."
    docker volume rm $volumeName 2>$null
    Write-Success "   Volume removed (all data deleted)"
}
else {
    Write-Info "   Volume doesn't exist, skipping"
}

Write-Host ""
Write-Info "=================================================="
Write-Info "           STEP 3: Starting New Database          "
Write-Info "=================================================="
Write-Host ""

# Check if docker-compose.yml exists
if (Test-Path "docker-compose.yml") {
    Write-Info "Starting database with docker-compose..."
    docker-compose up -d postgres
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "   Database container started"
    }
    else {
        Write-Error "   Failed to start container"
        exit 1
    }
}
else {
    Write-Info "Starting database with docker run..."
    docker run -d `
        --name $containerName `
        -e POSTGRES_USER=$dbUser `
        -e POSTGRES_PASSWORD=$dbPassword `
        -e POSTGRES_DB=$dbName `
        -p "${dbPort}:5432" `
        -v postgres_data:/var/lib/postgresql/data `
        postgres:15-alpine
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "   Database container started"
    }
    else {
        Write-Error "   Failed to start container"
        exit 1
    }
}

Write-Host ""
Write-Info "=================================================="
Write-Info "           STEP 4: Waiting for Database           "
Write-Info "=================================================="
Write-Host ""

Write-Info "Waiting for PostgreSQL to be ready..."
$maxAttempts = 30
$attempt = 0
$env:PGPASSWORD = $dbPassword

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "   Attempt $attempt/$maxAttempts..." -NoNewline
    
    $result = docker exec $containerName pg_isready -U $dbUser 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " Ready!" -ForegroundColor Green
        break
    }
    
    Write-Host " Not ready yet"
    Start-Sleep -Seconds 1
}

if ($attempt -eq $maxAttempts) {
    Write-Error "   Database failed to start after $maxAttempts seconds"
    exit 1
}

Write-Success "   Database is ready!"

Write-Host ""
Write-Info "=================================================="
Write-Info "           STEP 5: Applying Schema                "
Write-Info "=================================================="
Write-Host ""

Write-Info "Applying database schema..."

if (Test-Path "database/schema.sql") {
    Get-Content "database/schema.sql" | docker exec -i $containerName psql -U $dbUser -d $dbName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "   Schema applied successfully"
    }
    else {
        Write-Error "   Failed to apply schema"
        exit 1
    }
}
elseif (Test-Path "schema.sql") {
    Get-Content "schema.sql" | docker exec -i $containerName psql -U $dbUser -d $dbName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "   Schema applied successfully"
    }
    else {
        Write-Error "   Failed to apply schema"
        exit 1
    }
}
else {
    Write-Error "   schema.sql not found!"
    exit 1
}

Write-Host ""
Write-Info "=================================================="
Write-Info "           STEP 6: Verifying Schema               "
Write-Info "=================================================="
Write-Host ""

if (Test-Path "database/verify-schema.js") {
    Set-Location "database"
    npm run verify-schema
    $verifyResult = $LASTEXITCODE
    Set-Location ..
    
    if ($verifyResult -eq 0) {
        Write-Success "   Schema verification passed"
    }
    else {
        Write-Warning "   Schema verification had issues (but continuing)"
    }
}
else {
    Write-Info "   Skipping verification (verify-schema.js not found)"
}

# Seeding step
if (-not $SkipSeed) {
    Write-Host ""
    Write-Info "=================================================="
    Write-Info "           STEP 7: Seeding Database               "
    Write-Info "=================================================="
    Write-Host ""
    
    if (Test-Path "database/run-seeder.ps1") {
        & "database/run-seeder.ps1" -Force
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "   Seeding completed"
        }
        else {
            Write-Warning "   Seeding had issues"
        }
    }
    elseif (Test-Path "run-seeder.ps1") {
        & "run-seeder.ps1" -Force
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "   Seeding completed"
        }
        else {
            Write-Warning "   Seeding had issues"
        }
    }
    else {
        Write-Info "   Skipping seeding (run-seeder.ps1 not found)"
    }
}
else {
    Write-Info ""
    Write-Info "Skipping seeding (use -SkipSeed flag was used)"
}

# Summary
Write-Host ""
Write-Info "=================================================="
Write-Success "            DATABASE RECREATED!                   "
Write-Info "=================================================="
Write-Host ""
Write-Info "Database Details:"
Write-Host "   Container: $containerName"
Write-Host "   Database:  $dbName"
Write-Host "   Host:      localhost"
Write-Host "   Port:      $dbPort"
Write-Host "   User:      $dbUser"
Write-Host "   Password:  $dbPassword"
Write-Host ""
Write-Info "Useful Commands:"
Write-Host "   View logs:    docker logs $containerName"
Write-Host "   Connect:      psql -h localhost -p $dbPort -U $dbUser -d $dbName"
Write-Host "   Stop:         docker stop $containerName"
Write-Host "   Restart:      docker restart $containerName"
Write-Host ""
Write-Success "All done!"
Write-Host ""
