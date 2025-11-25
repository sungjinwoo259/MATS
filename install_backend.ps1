# Quick script to install backend dependencies
# Run this if you get "ModuleNotFoundError: No module named 'uvicorn'"

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow

# Activate virtual environment if it exists
if (Test-Path "venv\Scripts\Activate.ps1") {
    & "venv\Scripts\Activate.ps1"
    Write-Host "✅ Virtual environment activated" -ForegroundColor Green
} else {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    & "venv\Scripts\Activate.ps1"
}

# Upgrade pip
python -m pip install --upgrade pip

# Install requirements
Write-Host "Installing Python packages..." -ForegroundColor Yellow
pip install -r backend/requirements.txt

Write-Host "`n✅ Backend dependencies installed!" -ForegroundColor Green
Write-Host "`nStart the backend with:" -ForegroundColor Cyan
Write-Host "  venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "  python backend/main.py" -ForegroundColor White

