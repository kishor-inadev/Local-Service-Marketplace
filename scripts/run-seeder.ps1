#!/usr/bin/env pwsh
# Database Seeder - Root Folder Runner
# Run this from the project root folder

param(
    [switch]$SkipVerify,
    [switch]$Force,
    [switch]$TypeScript,
    [switch]$Help
)

# Forward all parameters to the database seeder script
$scriptPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\database\run-seeder.ps1"))

if (-not (Test-Path $scriptPath)) {
    Write-Host "Error: Seeder script not found at: $scriptPath" -ForegroundColor Red
    exit 1
}

# Build argument list
$args = @()
if ($SkipVerify) { $args += "-SkipVerify" }
if ($Force) { $args += "-Force" }
if ($TypeScript) { $args += "-TypeScript" }
if ($Help) { $args += "-Help" }

# Run the database seeder script
if ($args.Count -gt 0) {
    & $scriptPath @args
} else {
    & $scriptPath
}

exit $LASTEXITCODE
