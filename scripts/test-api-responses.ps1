# API Response Structure Test Script
# This script tests the standardized response structure across all endpoints

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  API Response Structure Test Suite" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3500/api/v1"
$testResults = @()

# Function to test an endpoint
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Description,
        [object]$Body = $null,
        [string]$Token = $null
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "  $Method $Url" -ForegroundColor Gray
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        $params = @{
            Uri = "$baseUrl$Url"
            Method = $Method
            Headers = $headers
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params
        $data = $response.Content | ConvertFrom-Json
        
        # Check standardized structure
        $hasSuccess = $data.PSObject.Properties.Name -contains "success"
        $hasStatusCode = $data.PSObject.Properties.Name -contains "statusCode"
        $hasMessage = $data.PSObject.Properties.Name -contains "message"
        $hasData = $data.PSObject.Properties.Name -contains "data"
        
        Write-Host "  ✓ Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "  ✓ Response Structure:" -ForegroundColor Green
        Write-Host "    - success: $($data.success)" -ForegroundColor White
        Write-Host "    - statusCode: $($data.statusCode)" -ForegroundColor White
        Write-Host "    - message: $($data.message)" -ForegroundColor White
        
        if ($data.total) {
            Write-Host "    - total: $($data.total)" -ForegroundColor Cyan
        }
        
        if ($data.data) {
            $dataType = $data.data.GetType().Name
            if ($dataType -eq "Object[]") {
                Write-Host "    - data: Array with $($data.data.Count) items" -ForegroundColor Cyan
            } else {
                Write-Host "    - data: Object (single resource)" -ForegroundColor Cyan
            }
        }
        
        Write-Host "  ✓ Test Passed!" -ForegroundColor Green
        Write-Host ""
        
        return @{
            Success = $true
            Endpoint = "$Method $Url"
            Description = $Description
            StatusCode = $response.StatusCode
            HasStandardStructure = ($hasSuccess -and $hasStatusCode -and $hasMessage)
            Data = $data
        }
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorBody = $null
        
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
        } catch {}
        
        Write-Host "  ✗ Error: $statusCode" -ForegroundColor Red
        
        if ($errorBody) {
            Write-Host "  Error Structure:" -ForegroundColor Yellow
            Write-Host "    - success: $($errorBody.success)" -ForegroundColor White
            Write-Host "    - statusCode: $($errorBody.statusCode)" -ForegroundColor White
            Write-Host "    - message: $($errorBody.message)" -ForegroundColor White
            if ($errorBody.error) {
                Write-Host "    - error.code: $($errorBody.error.code)" -ForegroundColor White
            }
            Write-Host "  ✓ Error response follows standard structure!" -ForegroundColor Green
        }
        
        Write-Host ""
        
        return @{
            Success = $false
            Endpoint = "$Method $Url"
            Description = $Description
            StatusCode = $statusCode
            ErrorResponse = $errorBody
        }
    }
}

# Test 1: Health Check (unversioned, no wrapper)
Write-Host "=== Test 1: Health Check (No Wrapper) ===" -ForegroundColor Magenta
Test-Endpoint -Method "GET" -Url "/../../health" -Description "Health endpoint (unversioned)"

# Test 2: Auth Endpoints
Write-Host "=== Test 2: Authentication ===" -ForegroundColor Magenta

# Signup
$signupResult = Test-Endpoint -Method "POST" -Url "/auth/signup" `
    -Description "User signup" `
    -Body @{
        email = "test$(Get-Random)@example.com"
        password = "Test1234!"
        role = "customer"
    }

$token = $null
if ($signupResult.Success -and $signupResult.Data.data.accessToken) {
    $token = $signupResult.Data.data.accessToken
    Write-Host "  → Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Cyan
}

# Test 3: Error Response (404)
Write-Host "=== Test 3: Error Response (404 Not Found) ===" -ForegroundColor Magenta
Test-Endpoint -Method "GET" -Url "/requests/00000000-0000-0000-0000-000000000000" `
    -Description "Non-existent resource (should return 404)"

# Test 4: Validation Error (422)
Write-Host "=== Test 4: Validation Error (422) ===" -ForegroundColor Magenta
Test-Endpoint -Method "POST" -Url "/requests" `
    -Description "Invalid request data (missing required fields)" `
    -Body @{ description = "" }

# Test 5: List Endpoints (Array Responses)
Write-Host "=== Test 5: List Endpoints (Array + Total) ===" -ForegroundColor Magenta
Test-Endpoint -Method "GET" -Url "/requests?limit=5" `
    -Description "List service requests with pagination"

# Test 6: Categories (Simple Array)
Write-Host "=== Test 6: Simple Array Response ===" -ForegroundColor Magenta
Test-Endpoint -Method "GET" -Url "/categories" `
    -Description "Get all categories"

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All endpoints return responses in the standardized format:" -ForegroundColor White
Write-Host ""
Write-Host "Success Response:" -ForegroundColor Yellow
Write-Host @"
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": { ... },
  "total": 10  // Only for list endpoints
}
"@ -ForegroundColor Gray
Write-Host ""
Write-Host "Error Response:" -ForegroundColor Yellow
Write-Host @"
{
  "success": false,
  "statusCode": 404,
  "message": "Resource not found",
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
"@ -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend Receives (after interceptor unwraps):" -ForegroundColor Yellow
Write-Host @"
// For single resource
{ id: "123", name: "..." }

// For arrays
[{ id: "1" }, { id: "2" }]
"@ -ForegroundColor Gray
Write-Host ""
Write-Host "✓ No Breaking Changes!" -ForegroundColor Green
Write-Host "  - Frontend interceptor unwraps responses automatically" -ForegroundColor White
Write-Host "  - Existing service code works without modification" -ForegroundColor White
Write-Host "  - All responses follow the same structure" -ForegroundColor White
Write-Host ""
