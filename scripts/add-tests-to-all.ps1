#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Adds test templates to ALL endpoints missing tests in the Postman collection.
.DESCRIPTION
    Reads the Postman collection and adds appropriate test scripts to every request
    that doesn't already have tests. Uses templates based on HTTP method.
    Creates a backup before modifying.
.PARAMETER CollectionPath
    Path to Postman collection. Default: docs/Local-Service-Marketplace.postman_collection.json
.PARAMETER DryRun
    Preview changes without saving.
.EXAMPLE
    .\scripts\add-tests-to-all.ps1
#>

[CmdletBinding()]
param(
    [string]$CollectionPath = "docs/Local-Service-Marketplace.postman_collection.json",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "Bulk adding tests to Postman collection..." -ForegroundColor Cyan

if (-not (Test-Path $CollectionPath)) {
    Write-Error "Collection not found: $CollectionPath"
    exit 1
}

# Backup
$backupPath = "$CollectionPath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
Copy-Item $CollectionPath $backupPath -Force
Write-Host "Backup: $backupPath" -ForegroundColor Green

# Load collection (use -Raw to preserve structure)
$collectionJson = Get-Content $CollectionPath -Raw
$collection = $collectionJson | ConvertFrom-Json

$stats = @{ Total = 0; WithTests = 0; WithoutTests = 0; Added = 0 }

# Templates - using single quotes to avoid PowerShell variable expansion
function Get-Tests($Method, $EndpointName) {
    $tests = @()

    switch ($Method.ToUpper()) {
        "GET" {
            if ($EndpointName -match 'health|Health') {
                $tests = @(
                    'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
                    '',
                    'pm.test("Service is healthy", function () {',
                    '    const d = pm.response.json();',
                    '    pm.expect(d).to.have.property("status", "healthy");',
                    '    pm.expect(d).to.have.property("timestamp");',
                    '});'
                )
            } elseif ($EndpointName -match 'list|List|all|All') {
                $tests = @(
                    'pm.test("Status 200", function () { pm.response.to.have.status(200); });',
                    '',
                    'pm.test("Returns array", function () {',
                    '    const d = pm.response.json();',
                    '    pm.expect(d.success).to.be.true;',
                    '    pm.expect(d.data).to.be.an("array");',
                    '});',
                    '',
                    'pm.test("Has total count", function () {',
                    '    const d = pm.response.json();',
                    '    pm.expect(d).to.have.property("total");',
                    '});'
                )
            } else {
                $tests = @(
                    'pm.test("Status 200", function () { pm.response.to.have.status(200); });',
                    '',
                    'pm.test("Standardized response", function () {',
                    '    const d = pm.response.json();',
                    '    pm.expect(d.success).to.be.true;',
                    '    pm.expect(d).to.have.property("data");',
                    '});',
                    '',
                    'pm.test("Has ID", function () {',
                    '    const d = pm.response.json();',
                    '    pm.expect(d.data).to.have.property("id");',
                    '});'
                )
            }
        }
        "POST" {
            if ($EndpointName -match 'logout|delete|remove|cancel|deactivate') {
                $tests = @(
                    'pm.test("Status 200/204", function () { pm.expect([200,204]).to.include(pm.response.code); });',
                    '',
                    'pm.test("Success", function () {',
                    '    const d = pm.response.json();',
                    '    pm.expect(d.success).to.be.true;',
                    '});'
                )
            } elseif ($EndpointName -match 'create|Create|submit|Submit|signup|Signup') {
                $tests = @(
                    'pm.test("Status 201", function () { pm.response.to.have.status(201); });',
                    '',
                    'pm.test("Standardized response", function () {',
                    '    const d = pm.response.json();',
                    '    pm.expect(d).to.have.property("success", true);',
                    '    pm.expect(d).to.have.property("statusCode", 201);',
                    '    pm.expect(d).to.have.property("data");',
                    '});',
                    '',
                    'pm.test("Has ID", function () {',
                    '    const d = pm.response.json();',
                    '    pm.expect(d.data).to.have.property("id");',
                    '});',
                    '',
                    'if (d.data && d.data.id) { pm.collectionVariables.set("resource_id", d.data.id); }'
                )
            } else {
                $tests = @(
                    'pm.test("Status 200/201", function () { pm.expect([200,201]).to.include(pm.response.code); });',
                    '',
                    'pm.test("Standardized response", function () {',
                    '    const d = pm.response.json();',
                    '    pm.expect(d.success).to.be.true;',
                    '    pm.expect(d).to.have.property("statusCode");',
                    '    pm.expect(d).to.have.property("data");',
                    '});'
                )
            }
        }
        "PUT" {
            $tests = @(
                'pm.test("Status 200/204", function () { pm.expect([200,204]).to.include(pm.response.code); });',
                '',
                'pm.test("Success", function () {',
                '    const d = pm.response.json();',
                '    pm.expect(d.success).to.be.true;',
                '});'
            )
        }
        "PATCH" {
            $tests = @(
                'pm.test("Status 200/204", function () { pm.expect([200,204]).to.include(pm.response.code); });',
                '',
                'pm.test("Success", function () {',
                '    const d = pm.response.json();',
                '    pm.expect(d.success).to.be.true;',
                '});'
            )
        }
        "DELETE" {
            $tests = @(
                'pm.test("Status 200/204/404", function () { pm.expect([200,204,404]).to.include(pm.response.code); });',
                '',
                'if ([200,204].includes(pm.response.code)) {',
                '    pm.test("Deleted", function () {',
                '        const d = pm.response.json();',
                '        pm.expect(d.success).to.be.true;',
                '    });',
                '} else if (pm.response.code === 404) {',
                '    pm.test("Not found", function () {',
                '        const d = pm.response.json();',
                '        pm.expect(d.success).to.be.false;',
                '    });',
                '}'
            )
        }
        default {
            $tests = @(
                'pm.test("Status 2xx", function () { pm.expect(pm.response.code).to.be.within(200,299); });',
                '',
                'pm.test("Has structure", function () {',
                '    const d = pm.response.json();',
                '    pm.expect(d).to.have.property("success");',
                '});'
            )
        }
    }

    return $tests
}

function Add-TestsToFolder([array]$items, [string]$path = "") {
    foreach ($item in $items) {
        if ($item.PSObject.Properties.Name -contains 'item' -and $item.item) {
            $newPath = if ($path) { "$path/$($item.name)" } else { $($item.name) }
            Add-TestsToFolder -items $item.item -path $newPath
        }
        elseif ($item.PSObject.Properties.Name -contains 'request' -and $item.request) {
            $stats.Total++

            $req = $item.request
            $method = $req.method
            $name = $item.name
            $fullName = if ($path) { "$path > $name" } else { $name }

            # Check for existing tests
            $hasTest = $false
            if ($item.event) {
                foreach ($evt in $item.event) {
                    if ($evt.listen -eq 'test' -and $evt.script -and $evt.script.exec) {
                        $scriptText = $evt.script.exec -join "`n"
                        if ($scriptText -match 'pm\.test\(') {
                            $hasTest = $true
                            break
                        }
                    }
                }
            }

            if ($hasTest) {
                $stats.WithTests++
                continue
            }

            # Generate tests
            $testLines = Get-Tests -Method $method -EndpointName $name

            # Create event object
            $newEvent = [PSCustomObject]@{
                listen = 'test'
                script = [PSCustomObject]@{
                    type = 'text/javascript'
                    exec = [System.Collections.ArrayList]$testLines
                }
            }

            # Add to item
            if (-not $item.event) { $item | Add-Member -NotePropertyName 'event' -NotePropertyValue @() }
            $item.event += $newEvent

            $stats.WithoutTests++
            $stats.Added++
            Write-Host "  [$method] $fullName" -ForegroundColor Green
        }
    }
}

# Process
Write-Host "Scanning collection..." -ForegroundColor Yellow
Add-TestsToFolder -items $collection.item

# Save
if (-not $DryRun) {
    $jsonOut = $collection | ConvertTo-Json -Depth 100
    Set-Content -Path $CollectionPath -Value $jsonOut -Encoding UTF8
    Write-Host "Collection updated." -ForegroundColor Green
} else {
    Write-Host "[DRY RUN] No changes saved." -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total:        $($stats.Total)" -ForegroundColor White
Write-Host "Had tests:    $($stats.WithTests)" -ForegroundColor Green
Write-Host "Added tests:  $($stats.Added)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "Remove -DryRun to apply." -ForegroundColor Yellow
} else {
    Write-Host "Success! All endpoints now have tests." -ForegroundColor Green
    Write-Host "Next: pnpm test:api" -ForegroundColor Cyan
}
