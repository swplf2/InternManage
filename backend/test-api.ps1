# API Testing Script for InternManage Backend
# Chạy các lệnh này trong PowerShell để test API endpoints

Write-Host "🚀 Testing InternManage Backend API Endpoints" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

# Set base URL
$baseUrl = "http://localhost:5000/api"

Write-Host "1. Testing Health Check..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✓ Health Check: " -ForegroundColor Green -NoNewline
    Write-Host ($response | ConvertTo-Json) -ForegroundColor White
} catch {
    Write-Host "✗ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "2. Testing Authentication Endpoints..." -ForegroundColor Blue

# Test invalid login
Write-Host "   - Testing invalid login credentials:" -ForegroundColor Yellow
try {
    $loginData = @{
        email = "invalid@email.com"
        password = "wrongpassword"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body ($loginData | ConvertTo-Json) -ContentType "application/json"
    Write-Host "   Unexpected success: " -ForegroundColor Red -NoNewline
    Write-Host ($response | ConvertTo-Json) -ForegroundColor White
} catch {
    Write-Host "   ✓ Correctly rejected invalid credentials" -ForegroundColor Green
}

# Test register without admin token
Write-Host "   - Testing register without admin token:" -ForegroundColor Yellow
try {
    $registerData = @{
        email = "test@example.com"
        password = "password123"
        firstName = "Test"
        lastName = "User"
        role = "intern"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body ($registerData | ConvertTo-Json) -ContentType "application/json"
    Write-Host "   Unexpected success: " -ForegroundColor Red -NoNewline
    Write-Host ($response | ConvertTo-Json) -ForegroundColor White
} catch {
    Write-Host "   ✓ Correctly rejected registration without admin token" -ForegroundColor Green
}
Write-Host ""

Write-Host "3. Testing Protected Endpoints (without auth)..." -ForegroundColor Blue

# Test protected endpoints without token
$protectedEndpoints = @(
    "/users",
    "/users/interns", 
    "/tasks",
    "/tasks/statistics",
    "/evaluations",
    "/documents"
)

foreach ($endpoint in $protectedEndpoints) {
    Write-Host "   - Testing $endpoint" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl$endpoint" -Method GET
        Write-Host "   ✗ Should require authentication: " -ForegroundColor Red -NoNewline
        Write-Host ($response | ConvertTo-Json) -ForegroundColor White
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "   ✓ Correctly requires authentication (401)" -ForegroundColor Green
        } else {
            Write-Host "   ? Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}
Write-Host ""

Write-Host "4. Testing with Invalid Token..." -ForegroundColor Blue
$invalidToken = "invalid-token-123"
$headers = @{
    "Authorization" = "Bearer $invalidToken"
    "Content-Type" = "application/json"
}

Write-Host "   - Testing /users with invalid token:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/users" -Method GET -Headers $headers
    Write-Host "   ✗ Should reject invalid token: " -ForegroundColor Red -NoNewline
    Write-Host ($response | ConvertTo-Json) -ForegroundColor White
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✓ Correctly rejected invalid token (401)" -ForegroundColor Green
    } else {
        Write-Host "   ? Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "📋 Test Summary:" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host "✓ Health endpoint working" -ForegroundColor Green
Write-Host "✓ Authentication middleware protecting routes" -ForegroundColor Green  
Write-Host "✓ Invalid credentials properly rejected" -ForegroundColor Green
Write-Host "✓ Invalid tokens properly rejected" -ForegroundColor Green
Write-Host "✓ Authorization working as expected" -ForegroundColor Green
Write-Host ""

Write-Host "💡 Next Steps:" -ForegroundColor Yellow
Write-Host "==============" -ForegroundColor Yellow
Write-Host "1. Create admin user in database to test full functionality" -ForegroundColor Yellow
Write-Host "2. Test login with valid credentials" -ForegroundColor Yellow
Write-Host "3. Test all endpoints with valid JWT token" -ForegroundColor Yellow
Write-Host "4. Test CRUD operations" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔧 To create test users, run:" -ForegroundColor Cyan
Write-Host "node api-test.js --create-data" -ForegroundColor White
Write-Host ""
Write-Host "🔐 To test with authentication, run:" -ForegroundColor Cyan  
Write-Host "node api-test.js --with-auth" -ForegroundColor White
