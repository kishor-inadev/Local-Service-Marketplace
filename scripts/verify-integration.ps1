# Quick Verification Script
# Tests all services through API Gateway

Write-Host "🔍 Platform Integration Verification" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$GATEWAY_URL = "http://localhost:3000"
$results = @{}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET"
    )
    
    try {
        $response = Invoke-WebRequest -Uri "$GATEWAY_URL$Url" -Method $Method -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ $Name" -ForegroundColor Green
        $results[$Name] = @{ Status = "OK"; Code = $response.StatusCode }
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "🔒 $Name (401 Unauthorized - Expected)" -ForegroundColor Yellow
            $results[$Name] = @{ Status = "Protected"; Code = 401 }
            return $true
        }
        else {
            Write-Host "❌ $Name (Error: $statusCode)" -ForegroundColor Red
            $results[$Name] = @{ Status = "Failed"; Code = $statusCode }
            return $false
        }
    }
}

Write-Host "Testing API Gateway Health..." -ForegroundColor Cyan
Test-Endpoint "API Gateway Health" "/health"

Write-Host "`nTesting Core Services..." -ForegroundColor Cyan
Test-Endpoint "Auth Service (Public)" "/auth/health" -Method "GET"
Test-Endpoint "User Service" "/users" -Method "GET"
Test-Endpoint "Request Service" "/requests" -Method "GET"
Test-Endpoint "Proposal Service" "/proposals" -Method "GET"
Test-Endpoint "Job Service" "/jobs" -Method "GET"
Test-Endpoint "Payment Service" "/payments" -Method "GET"
Test-Endpoint "Review Service" "/reviews" -Method "GET"
Test-Endpoint "Admin Service" "/admin/health" -Method "GET"
Test-Endpoint "Analytics Service" "/analytics/health" -Method "GET"

Write-Host "`nTesting Optional Services..." -ForegroundColor Cyan
Test-Endpoint "Messaging Service" "/messages" -Method "GET"
Test-Endpoint "Notification Service" "/notifications" -Method "GET"

Write-Host "`nTesting Service-Specific Endpoints..." -ForegroundColor Cyan
Test-Endpoint "Provider Services Endpoint" "/providers/test-id/services" -Method "PATCH"
Test-Endpoint "Provider Availability Endpoint" "/providers/test-id/availability" -Method "PATCH"

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$total = $results.Count
$ok = ($results.Values | Where-Object { $_.Status -eq "OK" }).Count
$protected = ($results.Values | Where-Object { $_.Status -eq "Protected" }).Count
$failed = ($results.Values | Where-Object { $_.Status -eq "Failed" }).Count

Write-Host "`nTotal Tests: $total" -ForegroundColor White
Write-Host "✅ OK: $ok" -ForegroundColor Green
Write-Host "🔒 Protected (Expected): $protected" -ForegroundColor Yellow
Write-Host "❌ Failed: $failed" -ForegroundColor Red

if ($failed -eq 0) {
    Write-Host "`n🎉 All services are healthy and properly integrated!" -ForegroundColor Green
}
else {
    Write-Host "`n⚠️  Some services are not responding. Check docker-compose logs." -ForegroundColor Yellow
}

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "🎛️  Feature Flags Status" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check .env file for feature flags
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    
    $flags = @{
        "EMAIL_ENABLED" = "📧 Email Notifications"
        "SMS_ENABLED" = "📱 SMS Notifications"
        "CACHE_ENABLED" = "💾 Redis Cache"
        "EVENT_BUS_ENABLED" = "📡 Kafka Events"
        "WORKERS_ENABLED" = "⚙️  Background Workers"
    }
    
    foreach ($flag in $flags.Keys) {
        $line = $envContent | Where-Object { $_ -match "^$flag=" }
        if ($line) {
            $value = ($line -split "=")[1]
            $status = if ($value -eq "true") { "✅ Enabled" } else { "❌ Disabled" }
            Write-Host "$($flags[$flag]): $status" -ForegroundColor $(if ($value -eq "true") { "Green" } else { "Gray" })
        }
        else {
            Write-Host "$($flags[$flag]): ⚠️  Not Configured" -ForegroundColor Yellow
        }
    }
}
else {
    Write-Host "⚠️  .env file not found. Using defaults." -ForegroundColor Yellow
}

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "📝 Recommendations" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "1. To enable email notifications:" -ForegroundColor White
Write-Host "   Set EMAIL_ENABLED=true in .env" -ForegroundColor Gray
Write-Host ""
Write-Host "2. To enable caching (better performance):" -ForegroundColor White
Write-Host "   Set CACHE_ENABLED=true in .env" -ForegroundColor Gray
Write-Host "   Start Redis: docker-compose --profile cache up" -ForegroundColor Gray
Write-Host ""
Write-Host "3. To test WebSocket messaging:" -ForegroundColor White
Write-Host "   cd services/messaging-service" -ForegroundColor Gray
Write-Host "   npm install" -ForegroundColor Gray
Write-Host ""
Write-Host "4. View detailed report:" -ForegroundColor White
Write-Host "   See PLATFORM_INTEGRATION_REPORT.md" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ Verification Complete!" -ForegroundColor Cyan
