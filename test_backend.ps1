# Quick script to test backend connectivity
Write-Host "Testing MATS Backend Connection..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if port 8000 is listening
Write-Host "[1/3] Checking if backend is running on port 8000..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr ":8000.*LISTENING"
if ($portCheck) {
    Write-Host "✅ Port 8000 is listening" -ForegroundColor Green
} else {
    Write-Host "❌ Port 8000 is not listening" -ForegroundColor Red
    Write-Host "   Start backend with: python backend/main.py" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check health endpoint
Write-Host "`n[2/3] Testing /health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Health endpoint responding" -ForegroundColor Green
        $health = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($health.status)" -ForegroundColor White
        Write-Host "   Tools available:" -ForegroundColor White
        $health.tools.PSObject.Properties | ForEach-Object {
            $status = if ($_.Value) { "✅" } else { "❌" }
            Write-Host "     $status $($_.Name)" -ForegroundColor $(if ($_.Value) { "Green" } else { "Yellow" })
        }
    }
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Check CORS headers
Write-Host "`n[3/3] Checking CORS configuration..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://localhost:5174"
    }
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Headers $headers -Method OPTIONS -UseBasicParsing -TimeoutSec 5
    if ($response.Headers["Access-Control-Allow-Origin"]) {
        Write-Host "✅ CORS configured correctly" -ForegroundColor Green
        Write-Host "   Allowed origin: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor White
    } else {
        Write-Host "⚠️  CORS headers not found in OPTIONS response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  CORS preflight check failed (this might be normal)" -ForegroundColor Yellow
}

Write-Host "`n" + "="*50 -ForegroundColor Cyan
Write-Host "Backend is ready!" -ForegroundColor Green
Write-Host "="*50 -ForegroundColor Cyan
Write-Host "`nFrontend should now be able to connect." -ForegroundColor White
Write-Host "If you still see errors, check:" -ForegroundColor Yellow
Write-Host "  1. Browser console for specific error messages" -ForegroundColor White
Write-Host "  2. Backend terminal for any error logs" -ForegroundColor White
Write-Host "  3. Firewall settings (Windows Firewall might block localhost)" -ForegroundColor White

