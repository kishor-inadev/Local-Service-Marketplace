<#
.SYNOPSIS
    Stop the Local Service Marketplace platform.

.DESCRIPTION
    Stops containers for the specified scaling level.
    Use the same -Level you started with to stop the correct stack.

.PARAMETER Level
    Scaling level 1-5. Default: 1

.PARAMETER Remove
    Also remove containers and networks (docker compose down). Default: stops only.

.PARAMETER Clean
    Remove containers, networks AND volumes (full reset — deletes all data).

.EXAMPLE
    .\scripts\stop.ps1             # stop Level 1 stack
    .\scripts\stop.ps1 -Level 3   # stop Level 3 stack
    .\scripts\stop.ps1 -Remove    # stop and remove containers
    .\scripts\stop.ps1 -Clean     # full reset, delete all data
#>

param(
    [ValidateRange(1,5)]
    [int]$Level = 1,
    [switch]$Remove,
    [switch]$Clean
)

Write-Host ""
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "  Stopping Level $Level stack..." -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host ""

if ($Clean) {
    Write-Host "Full reset — removing containers, networks and volumes..." -ForegroundColor Red
    docker compose down -v
} elseif ($Remove) {
    & "$PSScriptRoot\scale.ps1" -Level $Level -Down
} else {
    docker compose stop
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Services stopped. To remove containers run:" -ForegroundColor Cyan
        Write-Host "  .\scripts\stop.ps1 -Level $Level -Remove" -ForegroundColor Gray
        Write-Host "To start again run:" -ForegroundColor Cyan
        Write-Host "  .\scripts\start.ps1 -Level $Level" -ForegroundColor Gray
        Write-Host ""
    }
}
