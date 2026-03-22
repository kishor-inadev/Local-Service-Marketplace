@echo off
REM Database Seeder - Root Folder Runner (Windows Batch)
REM Run this from the project root folder

set "SCRIPT_DIR=%~dp0"
set "SEEDER_BAT=%SCRIPT_DIR%..\database\run-seeder.bat"

if exist "%SEEDER_BAT%" (
    call "%SEEDER_BAT%"
) else (
    echo Error: %SEEDER_BAT% not found
    pause
    exit /b 1
)
