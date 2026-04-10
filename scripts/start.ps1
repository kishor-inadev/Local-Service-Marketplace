<#
.SYNOPSIS
    Start the Local Service Marketplace platform.

.DESCRIPTION
    Wrapper around scale.ps1. Starts the platform at the specified scaling level.

    Level 1  MVP          ~200-500 concurrent users   (PostgreSQL only)
    Level 2  Cache        ~500-1000 concurrent users  (+ Redis cache)
    Level 3  Workers      ~2000+ concurrent users     (+ Redis + BullMQ workers)
    Level 4  Events       ~10000+ concurrent users    (+ Kafka event bus)
    Level 5  Full Scale   ~50000+ concurrent users    (all infrastructure)

.PARAMETER Level
    Scaling level 1-5. Default: 1 (MVP)

.PARAMETER Build
    Rebuild Docker images before starting.

.EXAMPLE
    .\scripts\start.ps1             # start at Level 1 (MVP)
    .\scripts\start.ps1 -Level 3   # start at Level 3 (workers)
    .\scripts\start.ps1 -Level 5   # full scale
#>

param(
    [ValidateRange(1,5)]
    [int]$Level = 1,
    [switch]$Build
)

& "$PSScriptRoot\scale.ps1" -Level $Level -Build:$Build
