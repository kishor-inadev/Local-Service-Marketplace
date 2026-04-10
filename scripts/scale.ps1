<#
.SYNOPSIS
    Start the Local Service Marketplace at a specific scaling level.

.DESCRIPTION
    Maps each scaling level to the correct docker compose command, profile,
    and overlay file. Secrets and connection strings are still read from
    docker.env — this script only controls infrastructure flags.

    Level 1  MVP / default       ~200-350 concurrent users
    Level 2  Cache Layer         ~500-1000 concurrent users
    Level 3  Worker Layer        ~2000+ concurrent users
    Level 4  Event-Driven        ~10000+ concurrent users
    Level 5  Full Scale          ~50000+ concurrent users

.PARAMETER Level
    Scaling level 1-5. Defaults to 1 (MVP).

.PARAMETER Down
    Stop and remove containers for the specified level instead of starting them.

.PARAMETER Build
    Rebuild Docker images before starting containers.

.PARAMETER Detach
    Run containers in the background (default: true).

.EXAMPLE
    # Start at Level 1 (MVP — default local dev)
    .\scripts\scale.ps1 -Level 1

    # Start at Level 3 (Workers enabled)
    .\scripts\scale.ps1 -Level 3

    # Rebuild images then start at Level 4
    .\scripts\scale.ps1 -Level 4 -Build

    # Stop Level 5 stack
    .\scripts\scale.ps1 -Level 5 -Down
#>

param(
    [ValidateRange(1, 5)]
    [int]$Level = 1,

    [switch]$Down,

    [switch]$Build,

    [bool]$Detach = $true
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ─── Level definitions ────────────────────────────────────────────────────────

$levels = @{
    1 = @{
        Label       = 'Level 1 — MVP'
        Capacity    = '200-350 concurrent users'
        Profile     = $null                          # no profile = default services only
        OverlayFile = $null                          # no overlay needed
        Features    = @('All feature flags OFF', 'PostgreSQL only', 'No Redis, no Kafka')
    }
    2 = @{
        Label       = 'Level 2 — Cache Layer'
        Capacity    = '500-1,000 concurrent users'
        Profile     = 'cache'
        OverlayFile = 'docker compose.level2.yml'
        Features    = @('Redis cache ON', 'CACHE_ENABLED=true', 'Reduced DB query load')
    }
    3 = @{
        Label       = 'Level 3 — Worker Layer'
        Capacity    = '2,000+ concurrent users'
        Profile     = 'workers'
        OverlayFile = 'docker compose.level3.yml'
        Features    = @('Redis + BullMQ workers ON', 'CACHE_ENABLED + WORKERS_ENABLED=true',
                        'Background jobs: email, ratings, analytics, cleanup')
    }
    4 = @{
        Label       = 'Level 4 — Event-Driven'
        Capacity    = '10,000+ concurrent users'
        Profile     = 'events'
        OverlayFile = 'docker compose.level4.yml'
        Features    = @('Redis + Kafka + Zookeeper ON', 'EVENT_BUS_ENABLED=true',
                        'Services communicate via Kafka topics', 'Full notification channels')
    }
    5 = @{
        Label       = 'Level 5 — Full Scale'
        Capacity    = '50,000+ concurrent users'
        Profile     = 'full'
        OverlayFile = 'docker compose.level5.yml'
        Features    = @('Redis + Kafka + Zookeeper + infrastructure-service ON',
                        'Redis distributed rate limiting', 'All notification channels + device tracking',
                        'WORKER_CONCURRENCY=20, DB_POOL_MAX=30')
    }
}

$def = $levels[$Level]

# ─── Display what will happen ────────────────────────────────────────────────

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  $($def.Label)" -ForegroundColor Cyan
Write-Host "  Capacity: $($def.Capacity)" -ForegroundColor Gray
Write-Host "==================================================" -ForegroundColor Cyan
foreach ($f in $def.Features) {
    Write-Host "  • $f" -ForegroundColor DarkCyan
}
Write-Host ""

# ─── Build compose arguments ─────────────────────────────────────────────────

$composeFiles = @('-f', 'docker compose.yml')

if ($def.OverlayFile) {
    $composeFiles += @('-f', $def.OverlayFile)
}

$profileArgs = @()
if ($def.Profile) {
    $profileArgs = @('--profile', $def.Profile)
}

# ─── Run ─────────────────────────────────────────────────────────────────────

if ($Down) {
    $cmd = @('docker', 'compose') + $composeFiles + $profileArgs + @('down')
    Write-Host "Stopping $($def.Label) stack..." -ForegroundColor Yellow
    Write-Host "> $($cmd -join ' ')" -ForegroundColor DarkGray
    Write-Host ""
    & docker compose @composeFiles @profileArgs down
} else {
    $upArgs = @('up')
    if ($Detach) { $upArgs += '-d' }
    if ($Build)  { $upArgs += '--build' }

    $cmd = @('docker', 'compose') + $composeFiles + $profileArgs + $upArgs
    Write-Host "Starting $($def.Label) stack..." -ForegroundColor Green
    Write-Host "> $($cmd -join ' ')" -ForegroundColor DarkGray
    Write-Host ""

    & docker compose @composeFiles @profileArgs @upArgs

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ $($def.Label) is running." -ForegroundColor Green
        Write-Host ""
        Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
        Write-Host "  API Gateway: http://localhost:3700" -ForegroundColor White
        Write-Host "  Health:      http://localhost:3700/health" -ForegroundColor White
        if ($Level -ge 3) {
            Write-Host "  Redis port:  localhost:6379" -ForegroundColor White
        }
        if ($Level -ge 4) {
            Write-Host "  Kafka port:  localhost:9092" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "  Logs:   docker compose logs -f <service-name>" -ForegroundColor DarkGray
        Write-Host "  Stop:   .\scripts\scale.ps1 -Level $Level -Down" -ForegroundColor DarkGray
        Write-Host ""
    }
}
