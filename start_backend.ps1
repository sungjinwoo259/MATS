# Quick script to start the backend server
# Run this after activating the virtual environment

Write-Host "Starting MATS Backend API..." -ForegroundColor Cyan

# Check if venv exists
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "Run: .\install_backend.ps1" -ForegroundColor Yellow
    exit 1
}

# Activate virtual environment
& "venv\Scripts\Activate.ps1"

# Check if uvicorn is installed
$uvicornCheck = python -c "import uvicorn" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing uvicorn..." -ForegroundColor Yellow
    pip install uvicorn fastapi python-multipart
}

# Start the server
Write-Host "`n✅ Backend starting on http://localhost:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow

python backend/main.py

