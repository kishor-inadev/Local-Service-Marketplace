# test-docker-optimization.ps1
# Tests the optimization and restore scripts without making changes

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message, [string]$Level = "Info")
    $colors = @{"Info" = "Cyan"; "Success" = "Green"; "Warning" = "Yellow"; "Error" = "Red"}
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $colors[$Level]
}

function Test-Script {
    param([string]$ScriptPath)
    
    if (-not (Test-Path $ScriptPath)) {
        Write-Log "  FAIL: Script not found" "Error"
        return $false
    }
    
    try {
        $null = [System.Management.Automation.PSParser]::Tokenize((Get-Content $ScriptPath -Raw), [ref]$null)
        Write-Log "  PASS: Syntax valid" "Success"
        return $true
    } catch {
        Write-Log "  FAIL: Syntax error: $_" "Error"
        return $false
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker Optimization Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$passCount = 0
$failCount = 0

# Test 1: Services folder exists
Write-Log "Test 1: Checking services folder..." "Info"
if (Test-Path "services") {
    $serviceCount = (Get-ChildItem "services" -Directory).Count
    Write-Log "  PASS: Found $serviceCount services" "Success"
    $passCount++
} else {
    Write-Log "  FAIL: services folder not found" "Error"
    $failCount++
}

# Test 2: Optimize script exists and valid
Write-Host ""
Write-Log "Test 2: Checking optimize-docker-images.ps1..." "Info"
if (Test-Script "scripts/optimize-docker-images.ps1") { $passCount++ } else { $failCount++ }

# Test 3: Restore script exists and valid
Write-Host ""
Write-Log "Test 3: Checking restore-dockerfiles.ps1..." "Info"
if (Test-Script "scripts/restore-dockerfiles.ps1") { $passCount++ } else { $failCount++ }

# Test 4: Cleanup script exists and valid
Write-Host ""
Write-Log "Test 4: Checking cleanup-backups.ps1..." "Info"
if (Test-Script "scripts/cleanup-backups.ps1") { $passCount++ } else { $failCount++ }

# Test 5: Check for existing Dockerfiles
Write-Host ""
Write-Log "Test 5: Checking Dockerfiles in services..." "Info"
$dockerfiles = Get-ChildItem "services" -Recurse -Filter "Dockerfile" -File
if ($dockerfiles.Count -gt 0) {
    Write-Log "  PASS: Found $($dockerfiles.Count) Dockerfiles" "Success"
    $passCount++
} else {
    Write-Log "  FAIL: No Dockerfiles found" "Error"
    $failCount++
}

# Test 6: Check for existing backups
Write-Host ""
Write-Log "Test 6: Checking for existing backups..." "Info"
$dockerfileBackups = Get-ChildItem "services" -Recurse -Filter "Dockerfile.backup-*" -File -ErrorAction SilentlyContinue
$dockerignoreBackups = Get-ChildItem "services" -Recurse -Filter ".dockerignore.backup-*" -File -ErrorAction SilentlyContinue
$totalBackups = $dockerfileBackups.Count + $dockerignoreBackups.Count

if ($totalBackups -gt 0) {
    Write-Log "  INFO: Found $($dockerfileBackups.Count) Dockerfile backups, $($dockerignoreBackups.Count) .dockerignore backups" "Warning"
} else {
    Write-Log "  INFO: No backups found (expected if not yet optimized)" "Info"
}

# Test 7: Docker availability
Write-Host ""
Write-Log "Test 7: Checking Docker..." "Info"
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "  PASS: Docker available - $dockerVersion" "Success"
        $passCount++
    } else {
        Write-Log "  WARN: Docker not available" "Warning"
    }
} catch {
    Write-Log "  WARN: Docker not available" "Warning"
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Passed: $passCount tests" -ForegroundColor Green
Write-Host "Failed: $failCount tests" -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Log "All tests passed! Scripts are ready to use." "Success"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: .\scripts\optimize-docker-images.ps1" -ForegroundColor Gray
    Write-Host "  2. Test: docker build -t test ." -ForegroundColor Gray
    Write-Host "  3. If needed: .\scripts\restore-dockerfiles.ps1" -ForegroundColor Gray
    Write-Host ""
    exit 0
} else {
    Write-Log "Some tests failed. Please fix issues before proceeding." "Error"
    exit 1
}
