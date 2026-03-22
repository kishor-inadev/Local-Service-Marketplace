# CORS Fix Verification Test
# Run this from PowerShell to test CORS

Write-Host "=== Testing CORS Configuration ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3500"
$origin = "http://localhost:3000"

Write-Host "Testing CORS Preflight (OPTIONS request)..." -ForegroundColor Yellow

# Test OPTIONS request (preflight)
$headers = @{
    "Origin" = $origin
    "Access-Control-Request-Method" = "POST"
    "Access-Control-Request-Headers" = "Content-Type"
}

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/categories" `
        -Method OPTIONS `
        -Headers $headers `
        -UseBasicParsing

    Write-Host "✓ Preflight Request Successful" -ForegroundColor Green
    Write-Host ""
    Write-Host "CORS Response Headers:" -ForegroundColor Cyan
    
    $allowOrigin = $response.Headers["Access-Control-Allow-Origin"]
    $allowMethods = $response.Headers["Access-Control-Allow-Methods"]
    $allowHeaders = $response.Headers["Access-Control-Allow-Headers"]
    $allowCredentials = $response.Headers["Access-Control-Allow-Credentials"]
    
    if ($allowOrigin) {
        Write-Host "  Access-Control-Allow-Origin: $allowOrigin" -ForegroundColor White
    }
    if ($allowMethods) {
        Write-Host "  Access-Control-Allow-Methods: $allowMethods" -ForegroundColor White
    }
    if ($allowHeaders) {
        Write-Host "  Access-Control-Allow-Headers: $allowHeaders" -ForegroundColor White
    }
    if ($allowCredentials) {
        Write-Host "  Access-Control-Allow-Credentials: $allowCredentials" -ForegroundColor White
    }
    
    Write-Host ""
    
    if ($allowOrigin -eq $origin -or $allowOrigin -eq "*") {
        Write-Host "✓ Origin Allowed: $allowOrigin" -ForegroundColor Green
    } else {
        Write-Host "✗ Origin Not Allowed! Got: $allowOrigin" -ForegroundColor Red
    }
    
    if ($allowCredentials -eq "true") {
        Write-Host "✓ Credentials Allowed" -ForegroundColor Green
    } else {
        Write-Host "⚠ Credentials Not Allowed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ Preflight Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing Actual GET Request..." -ForegroundColor Yellow

$headers2 = @{
    "Origin" = $origin
}

try {
    $response2 = Invoke-WebRequest -Uri "$baseUrl/api/v1/categories" `
        -Method GET `
        -Headers $headers2 `
        -UseBasicParsing
    
    Write-Host "✓ GET Request Successful" -ForegroundColor Green
    Write-Host "  Status: $($response2.StatusCode)" -ForegroundColor White
    
    $allowOrigin2 = $response2.Headers["Access-Control-Allow-Origin"]
    if ($allowOrigin2) {
        Write-Host "  Access-Control-Allow-Origin: $allowOrigin2" -ForegroundColor White
    }
} catch {
    Write-Host "✗ GET Request Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== CORS Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you still see CORS errors in the browser:" -ForegroundColor Yellow
Write-Host "1. Clear browser cache (Ctrl+Shift+Del)" -ForegroundColor White
Write-Host "2. Hard refresh the page (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "3. Check browser console for detailed error" -ForegroundColor White
Write-Host "4. Verify frontend is running on http://localhost:3000" -ForegroundColor White
Write-Host "5. Make sure API Gateway is on http://localhost:3500" -ForegroundColor White
Write-Host ""

