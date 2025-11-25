# MATS Windows Setup Script
# Run this script in PowerShell (as Administrator recommended)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MATS - Windows Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check Python
Write-Host "`n[1/5] Checking Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Python not found. Install from python.org" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "`n[2/5] Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Install from nodejs.org" -ForegroundColor Red
    exit 1
}

# Check Java (for JADX/APKTool)
Write-Host "`n[3/5] Checking Java..." -ForegroundColor Yellow
$javaVersion = java -version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Java installed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Java not found. Installing via winget..." -ForegroundColor Yellow
    winget install Oracle.JavaRuntimeEnvironment --silent
}

# Create Python virtual environment
Write-Host "`n[4/5] Setting up Python virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "✅ Virtual environment already exists" -ForegroundColor Green
} else {
    python -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

# Activate venv and install Python dependencies
Write-Host "`n[5/5] Installing Python dependencies..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"
pip install --upgrade pip
pip install -r backend/requirements.txt

# Run tools setup
Write-Host "`n[6/6] Setting up analysis tools..." -ForegroundColor Yellow
python backend/tools_setup.py

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Activate virtual environment: .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "2. Start backend: python backend/main.py" -ForegroundColor White
Write-Host "3. In another terminal, start frontend: npm run dev" -ForegroundColor White

