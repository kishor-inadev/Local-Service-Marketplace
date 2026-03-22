# cleanup-backups.ps1
# Removes all Dockerfile backup files with full error handling

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
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Cleanup Dockerfile Backups v2.0" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Validate services folder
$servicesPath = Join-Path $PSScriptRoot "services"
if (-not (Test-Path $servicesPath)) {
    Write-Log "ERROR: services folder not found" "Error"
    exit 1
}

Write-Log "Scanning for backup files..." "Info"

try {
    $dockerfileBackups = Get-ChildItem -Path $servicesPath -Recurse -Filter "Dockerfile.backup-*" -File -ErrorAction Stop
    $dockerignoreBackups = Get-ChildItem -Path $servicesPath -Recurse -Filter ".dockerignore.backup-*" -File -ErrorAction Stop
    $allBackups = $dockerfileBackups + $dockerignoreBackups
} catch {
    Write-Log "ERROR: Failed to scan for backups: $_" "Error"
    exit 1
}

if ($allBackups.Count -eq 0) {
    Write-Host ""
    Write-Log "No backup files found. Nothing to clean up." "Success"
    exit 0
}

Write-Host ""
Write-Log "Found $($allBackups.Count) backup file(s)" "Warning"
Write-Host ""

# Group by service and type
$backupsByService = $allBackups | Group-Object { $_.Directory.Name }

foreach ($group in $backupsByService) {
    Write-Host "  $($group.Name):" -ForegroundColor Cyan
    $dockerfileCount = ($group.Group | Where-Object { $_.Name -like "Dockerfile.backup-*" }).Count
    $dockerignoreCount = ($group.Group | Where-Object { $_.Name -like ".dockerignore.backup-*" }).Count
    
    if ($dockerfileCount -gt 0) {
        Write-Host "    - Dockerfile backups: $dockerfileCount" -ForegroundColor Gray
    }
    if ($dockerignoreCount -gt 0) {
        Write-Host "    - .dockerignore backups: $dockerignoreCount" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "WARNING: This will permanently delete all backup files!" -ForegroundColor Red
Write-Host ""

# Interactive confirmation
$confirm = Read-Host "Type 'DELETE' to confirm deletion (or anything else to cancel)"

if ($confirm -ne "DELETE") {
    Write-Host ""
    Write-Log "Cleanup cancelled. No files were deleted." "Warning"
    exit 0
}

Write-Host ""
Write-Log "Starting cleanup..." "Info"
Write-Host ""

$deletedCount = 0
$failedCount = 0
$totalSize = 0

foreach ($backup in $allBackups) {
    try {
        $size = $backup.Length
        Remove-Item $backup.FullName -Force -ErrorAction Stop
        Write-Log "  Deleted: $($backup.Directory.Name)/$($backup.Name)" "Success"
        $deletedCount++
        $totalSize += $size
    } catch {
        Write-Log "  Failed: $($backup.Name) - $_" "Error"
        $failedCount++
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Successfully deleted: $deletedCount file(s)" -ForegroundColor Green
Write-Host "Space freed: $([math]::Round($totalSize / 1MB, 2)) MB" -ForegroundColor Green

if ($failedCount -gt 0) {
    Write-Host "Failed to delete: $failedCount file(s)" -ForegroundColor Red
    Write-Host ""
    Write-Log "Cleanup completed with errors" "Warning"
    exit 1
}

Write-Host ""
Write-Log "Cleanup completed successfully!" "Success"
Write-Host ""

exit 0
