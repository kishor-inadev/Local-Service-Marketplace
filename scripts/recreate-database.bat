@echo off
REM Quick Database Recreation Script

echo ================================================
echo    PostgreSQL Database Recreation (Docker)
echo ================================================
echo.

echo WARNING: This will delete ALL data in the database!
echo.
set /p confirm="Are you sure? Type 'yes' to continue: "

if /i not "%confirm%"=="yes" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo Stopping and removing container...
docker stop marketplace-postgres 2>nul
docker rm marketplace-postgres 2>nul

echo Removing volume...
docker volume rm local-service-marketplace_postgres_data 2>nul

echo.
echo Starting new database...
docker-compose up -d postgres

echo.
echo Waiting for database to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Applying schema...
type database\schema.sql | docker exec -i marketplace-postgres psql -U postgres -d marketplace

echo.
echo Verifying schema...
cd database
call npm run verify-schema
cd ..

echo.
echo Running seeder...
call "%~dp0run-seeder.ps1" -Force

echo.
echo ================================================
echo    Database Recreated Successfully!
echo ================================================
echo.
pause
