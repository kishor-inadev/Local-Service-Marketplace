#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Analyzes the Postman collection to identify endpoints with and without test scripts.
.DESCRIPTION
    Scans the collection JSON and reports:
    - Total endpoints
    - Endpoints with tests
    - Endpoints without tests
    - Breakdown by HTTP method
    - Coverage statistics
#>

$collectionPath = "docs/Local-Service-Marketplace.postman_collection.json"

if (-not (Test-Path $collectionPath)) {
    Write-Error "Collection not found: $collectionPath"
    exit 1
}

Write-Host "Analyzing Postman collection..." -ForegroundColor Cyan
Write-Host ""

$collection = Get-Content $collectionPath -Raw | ConvertFrom-Json

$totalEndpoints = 0
$endpointsWithTests = 0
$endpointsWithoutTests = [System.Collections.Generic.List[object]]::new()
$byMethod = @{
    GET = @{ Total = 0; WithTests = 0; WithoutTests = [System.Collections.Generic.List[string]]::new() }
    POST = @{ Total = 0; WithTests = 0; WithoutTests = [System.Collections.Generic.List[string]]::new() }
    PUT = @{ Total = 0; WithTests = 0; WithoutTests = [System.Collections.Generic.List[string]]::new() }
    PATCH = @{ Total = 0; WithTests = 0; WithoutTests = [System.Collections.Generic.List[string]]::new() }
    DELETE = @{ Total = 0; WithTests = 0; WithoutTests = [System.Collections.Generic.List[string]]::new() }
    OTHER = @{ Total = 0; WithTests = 0; WithoutTests = [System.Collections.Generic.List[string]]::new() }
}

function Traverse-Item {
    param($items, $path = "")

    foreach ($item in $items) {
        if ($item.item) {
            # It's a folder
            $newPath = if ($path) { "$path/$($item.name)" } else { $($item.name) }
            Traverse-Item -items $item.item -path $newPath
        } elseif ($item.request) {
            # It's a request
            $totalEndpoints++
            $request = $item.request
            $method = $request.method
            $name = $item.name
            $fullPath = if ($path) { "$path > $name" } else { $name }

            # Count by method
            if ($byMethod.ContainsKey($method)) {
                $byMethod[$method].Total++
            } else {
                $byMethod.OTHER.Total++
            }

            # Check if it has test scripts
            $hasTests = $false
            if ($item.event) {
                foreach ($event in $item.event) {
                    if ($event.listen -eq "test" -and $event.script -and $event.script.exec) {
                        $scriptContent = $event.script.exec -join "`n"
                        if ($scriptContent -match "pm\.test\(") {
                            $hasTests = $true
                            break
                        }
                    }
                }
            }

            if ($hasTests) {
                $endpointsWithTests++
                if ($byMethod.ContainsKey($method)) {
                    $byMethod[$method].WithTests++
                } else {
                    $byMethod.OTHER.WithTests++
                }
            } else {
                $endpointsWithoutTests.Add([PSCustomObject]@{
                    Method = $method
                    Name = $name
                    Path = $fullPath
                }) | Out-Null
                if ($byMethod.ContainsKey($method)) {
                    $byMethod[$method].WithoutTests.Add($name) | Out-Null
                } else {
                    $byMethod.OTHER.WithoutTests.Add($name) | Out-Null
                }
            }
        }
    }
}

Traverse-Item -items $collection.item

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Collection Analysis Report" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Endpoints: $totalEndpoints"
Write-Host "With Tests:      $endpointsWithTests"
Write-Host "Without Tests:   ($($endpointsWithoutTests.Count))"
Write-Host "Coverage:        $([math]::Round(($endpointsWithTests / $totalEndpoints) * 100, 2))%"
Write-Host ""

Write-Host "Breakdown by HTTP Method:" -ForegroundColor Yellow
Write-Host "--------------------------------------------------"
foreach ($method in $byMethod.Keys | Sort-Object) {
    $stats = $byMethod[$method]
    if ($stats.Total -gt 0) {
        $coverage = if ($stats.Total -gt 0) { [math]::Round(($stats.WithTests / $stats.Total) * 100, 2) } else { 0 }
        Write-Host "$method`: $($stats.WithTests)/$($stats.Total) tested ($coverage%)"
        if ($stats.WithoutTests.Count -gt 0) {
            foreach ($endpoint in $stats.WithoutTests | Select-Object -First 5) {
                Write-Host "  └─ $endpoint" -ForegroundColor Gray
            }
            if ($stats.WithoutTests.Count -gt 5) {
                Write-Host "  └─ ... and $($stats.WithoutTests.Count - 5) more" -ForegroundColor Gray
            }
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Endpoints Without Tests" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($endpointsWithoutTests.Count -eq 0) {
    Write-Host "All endpoints have test coverage!" -ForegroundColor Green
} else {
    Write-Host "Endpoints needing tests:" -ForegroundColor Yellow
    Write-Host ""

    # Group by folder
    $grouped = $endpointsWithoutTests | Group-Object { $_.Path.Split('>')[0].Trim() } | Sort-Object Name
    foreach ($group in $grouped) {
        Write-Host "$($group.Name) ($($group.Count))" -ForegroundColor Cyan
        foreach ($ep in $group.Group | Select-Object -First 10) {
            Write-Host "  [$($ep.Method)] $($ep.Name)" -ForegroundColor White
        }
        if ($group.Count -gt 10) {
            Write-Host "  ... and $($group.Count - 10) more" -ForegroundColor Gray
        }
        Write-Host ""
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Recommendations" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Prioritize adding tests to all POST/PUT/PATCH endpoints (data modification)"
Write-Host "2. Ensure all GET endpoints have at least basic status code validation"
Write-Host "3. Add error case tests (404, 401, 422) for endpoints that support them"
Write-Host "4. Use the scripts/add-tests-to-all.ps1 to automate test addition (WIP)"
Write-Host ""

# Export list to CSV for reference
$csvPath = "scripts/endpoints-without-tests.csv"
$endpointsWithoutTests | Select-Object Method, Name, Path | Export-Csv -Path $csvPath -NoTypeInformation
Write-Host "Detailed list exported to: $csvPath" -ForegroundColor Green
