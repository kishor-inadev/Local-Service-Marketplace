# ===============================================
# Database Seed Script
# Populates the database with sample data
# ===============================================

Write-Host "Database Seeding Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$databaseDir = Join-Path $rootDir "database"

# Load environment variables from root .env
$envPath = Join-Path $rootDir ".env"
if (Test-Path $envPath) {
    Write-Host "Loading environment variables from .env..." -ForegroundColor Yellow
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$name" -Value $value
        }
    }
    Write-Host "   Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "Warning: .env file not found at $envPath, using defaults" -ForegroundColor Yellow
}

Write-Host ""

# Set PostgreSQL connection details
$env:POSTGRES_HOST = if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST } else { "localhost" }
$env:POSTGRES_PORT = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5432" }
$env:POSTGRES_USER = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "postgres" }
$env:POSTGRES_PASSWORD = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "postgres" }
$env:POSTGRES_DB = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "marketplace" }

Write-Host "Database Configuration:" -ForegroundColor Cyan
Write-Host "   Host: $env:POSTGRES_HOST" -ForegroundColor White
Write-Host "   Port: $env:POSTGRES_PORT" -ForegroundColor White
Write-Host "   Database: $env:POSTGRES_DB" -ForegroundColor White
Write-Host "   User: $env:POSTGRES_USER" -ForegroundColor White
Write-Host ""

# Check if PostgreSQL is accessible
Write-Host "Checking database connection..." -ForegroundColor Yellow
$pgIsReachable = $false

try {
    # Test if we can connect to PostgreSQL
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        $testConnection = docker exec postgres-db pg_isready -h localhost -U $env:POSTGRES_USER 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $pgIsReachable = $true
            Write-Host "   Database is accessible via Docker" -ForegroundColor Green
        } else {
            Write-Host "   Could not verify database connection via Docker" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   Docker not found, skipping connectivity check" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Could not verify database connection" -ForegroundColor Yellow
    Write-Host "   Proceeding anyway..." -ForegroundColor Yellow
}

Write-Host ""

# Navigate to database directory
Write-Host "Navigating to database directory: $databaseDir" -ForegroundColor Yellow
Set-Location -Path $databaseDir

# Always reinstall to ensure all dependencies work correctly
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "pnpm-lock.yaml" -Force -ErrorAction SilentlyContinue

npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Failed to install dependencies" -ForegroundColor Red
    Set-Location -Path $rootDir
    exit 1
}
Write-Host "   Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Confirmation prompt
Write-Host "WARNING: This will populate your database with sample data!" -ForegroundColor Red
Write-Host "   This script will create:" -ForegroundColor Yellow
Write-Host "   - 151 users (100 customers, 50 providers, 1 admin)" -ForegroundColor White
Write-Host "   - 15 service categories" -ForegroundColor White
Write-Host "   - 50+ providers with full profiles" -ForegroundColor White
Write-Host "   - 120+ service requests" -ForegroundColor White
Write-Host "   - 200+ proposals" -ForegroundColor White
Write-Host "   - 80+ jobs with payments, reviews, messages" -ForegroundColor White
Write-Host "   - And much more..." -ForegroundColor White
Write-Host ""

$confirmation = Read-Host "Do you want to continue? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host "Seeding cancelled" -ForegroundColor Red
    Set-Location -Path $rootDir
    exit
}

Write-Host ""
Write-Host "Starting database seeding..." -ForegroundColor Green
Write-Host ""

# Run the seed script
try {
    # Attempt to apply database schema if psql is available
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        Write-Host "Applying schema from database/schema.sql using psql..." -ForegroundColor Yellow
        $env:PGPASSWORD = $env:POSTGRES_PASSWORD
        & psql -h $env:POSTGRES_HOST -p $env:POSTGRES_PORT -U $env:POSTGRES_USER -d $env:POSTGRES_DB -f "schema.sql"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   Schema applied successfully" -ForegroundColor Green
        } else {
            Write-Host "   Failed to apply schema (psql exit code $LASTEXITCODE). You may need to run it manually." -ForegroundColor Yellow
        }
    } else {
        Write-Host "psql not found in PATH; skipping automatic schema apply." -ForegroundColor Yellow
        Write-Host "To apply schema manually run: psql -h $env:POSTGRES_HOST -p $env:POSTGRES_PORT -U $env:POSTGRES_USER -d $env:POSTGRES_DB -f database/schema.sql" -ForegroundColor Yellow
    }

    npm run seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "Database seeded successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Default Credentials:" -ForegroundColor Cyan
        Write-Host "   Admin:" -ForegroundColor Yellow
        Write-Host "   Email: admin@marketplace.com" -ForegroundColor White
        Write-Host "   Password: password123" -ForegroundColor White
        Write-Host ""
        Write-Host "   All Users:" -ForegroundColor Yellow
        Write-Host "   Password: password123" -ForegroundColor White
        Write-Host ""
        Write-Host "You can now start your application and see populated data!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "Seeding failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "Error running seed script:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

# Return to root directory
Set-Location -Path $rootDir

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')

