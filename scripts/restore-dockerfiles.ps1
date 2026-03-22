# restore-dockerfiles.ps1
# Restores original Dockerfiles from backups with full error handling

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("Info", "Success", "Warning", "Error")]
        [string]$Level = "Info"
    )
    
    $colors = @{
        "Info" = "Cyan"
        "Success" = "Green"
        "Warning" = "Yellow"
        "Error" = "Red"
    }
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $colors[$Level]
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restore Original Dockerfiles v2.0" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validate services folder exists
$servicesPath = Join-Path $PSScriptRoot "services"
if (-not (Test-Path $servicesPath)) {
    Write-Log "ERROR: services folder not found at: $servicesPath" "Error"
    exit 1
}

$services = Get-ChildItem -Path $servicesPath -Directory

if ($services.Count -eq 0) {
    Write-Log "ERROR: No services found in services folder" "Error"
    exit 1
}

Write-Log "Found $($services.Count) services to check" "Info"
Write-Host ""

$restoredCount = 0
$notFoundCount = 0
$failedCount = 0
$skippedCount = 0

foreach ($service in $services) {
    $serviceName = $service.Name
    Write-Log "Processing: $serviceName" "Info"
    
    $servicePath = $service.FullName
    $currentDockerfile = Join-Path $servicePath "Dockerfile"
    $currentDockerignore = Join-Path $servicePath ".dockerignore"
    
    try {
        # Find all Dockerfile backups
        $dockerfileBackups = Get-ChildItem -Path $servicePath -Filter "Dockerfile.backup-*" -ErrorAction Stop | 
                   Sort-Object LastWriteTime -Descending
        
        # Find all .dockerignore backups
        $dockerignoreBackups = Get-ChildItem -Path $servicePath -Filter ".dockerignore.backup-*" -ErrorAction Stop | 
                   Sort-Object LastWriteTime -Descending
        
        if ($dockerfileBackups.Count -eq 0) {
            Write-Log "  SKIP: No Dockerfile backup found" "Warning"
            $notFoundCount++
            continue
        }
        
        # Get the most recent Dockerfile backup
        $latestDockerfileBackup = $dockerfileBackups[0]
        
        # Get the most recent .dockerignore backup (may not exist)
        $latestDockerignoreBackup = if ($dockerignoreBackups.Count -gt 0) { $dockerignoreBackups[0] } else { $null }
        
        # Validate Dockerfile backup
        try {
            $backupContent = Get-Content $latestDockerfileBackup.FullName -Raw -ErrorAction Stop
            if ([string]::IsNullOrWhiteSpace($backupContent)) {
                throw "Dockerfile backup is empty"
            }
        } catch {
            Write-Log "  ERROR: Dockerfile backup is corrupted: $_" "Error"
            $failedCount++
            continue
        }
        
        # Check if current Dockerfile exists
        if (-not (Test-Path $currentDockerfile)) {
            Write-Log "  SKIP: Current Dockerfile not found" "Warning"
            $skippedCount++
            continue
        }
        
        # Restore Dockerfile
        $dockerfileTempFile = "$currentDockerfile.restore-temp"
        
        try {
            # Copy backup to temp file
            Copy-Item $latestDockerfileBackup.FullName $dockerfileTempFile -Force -ErrorAction Stop
            
            # Verify temp file
            $tempContent = Get-Content $dockerfileTempFile -Raw -ErrorAction Stop
            if ([string]::IsNullOrWhiteSpace($tempContent)) {
                throw "Temp file verification failed"
            }
            
            # Atomic replace
            Move-Item $dockerfileTempFile $currentDockerfile -Force -ErrorAction Stop
            
            Write-Log "  [1/2] Dockerfile restored from: $($latestDockerfileBackup.Name)" "Success"
            
        } catch {
            Write-Log "  ERROR: Failed to restore Dockerfile: $_" "Error"
            $failedCount++
            
            # Cleanup temp file if it exists
            if (Test-Path $dockerfileTempFile) {
                Remove-Item $dockerfileTempFile -Force -ErrorAction SilentlyContinue
            }
            continue
        }
        
        # Restore .dockerignore if backup exists
        if ($latestDockerignoreBackup) {
            $dockerignoreTempFile = "$currentDockerignore.restore-temp"
            
            try {
                # Copy backup to temp file
                Copy-Item $latestDockerignoreBackup.FullName $dockerignoreTempFile -Force -ErrorAction Stop
                
                # Verify temp file
                $tempContent = Get-Content $dockerignoreTempFile -Raw -ErrorAction Stop
                if ([string]::IsNullOrWhiteSpace($tempContent)) {
                    throw ".dockerignore temp file verification failed"
                }
                
                # Atomic replace
                Move-Item $dockerignoreTempFile $currentDockerignore -Force -ErrorAction Stop
                
                Write-Log "  [2/2] .dockerignore restored from: $($latestDockerignoreBackup.Name)" "Success"
                
            } catch {
                Write-Log "  WARN: Failed to restore .dockerignore: $_" "Warning"
                
                # Cleanup temp file if it exists
                if (Test-Path $dockerignoreTempFile) {
                    Remove-Item $dockerignoreTempFile -Force -ErrorAction SilentlyContinue
                }
                # Don't fail the whole operation for .dockerignore
            }
        } else {
            Write-Log "  [2/2] No .dockerignore backup found (skipped)" "Info"
        }
        
        $restoredCount++
        
    } catch {
        Write-Log "  ERROR: Unexpected error: $_" "Error"
        $failedCount++
    }
    
    Write-Host ""
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restore Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Successfully restored: $restoredCount services" -ForegroundColor Green
Write-Host "No backup found: $notFoundCount services" -ForegroundColor Yellow
Write-Host "Skipped: $skippedCount services" -ForegroundColor Yellow

if ($failedCount -gt 0) {
    Write-Host "Failed: $failedCount services" -ForegroundColor Red
    Write-Host ""
    Write-Log "Restore completed with errors" "Error"
    exit 1
}

if ($restoredCount -eq 0) {
    Write-Host ""
    Write-Log "No services were restored (no backups found or all skipped)" "Warning"
} else {
    Write-Host ""
    Write-Log "All Dockerfiles restored successfully!" "Success"
}

Write-Host ""
Write-Host "Backup files are kept for safety." -ForegroundColor Gray
Write-Host "To clean up backups, run: .\scripts\cleanup-backups.ps1" -ForegroundColor Gray
Write-Host ""

exit 0
