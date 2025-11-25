# Troubleshooting Guide

## CORS Errors

If you see errors like:
```
Access to fetch at 'http://localhost:8000/health' from origin 'http://localhost:5174' 
has been blocked by CORS policy
```

### Solution 1: Make sure backend is running

1. **Start the backend** in a separate terminal:
```powershell
# Activate virtual environment
venv\Scripts\Activate.ps1

# Start backend
python backend/main.py
```

Or use the helper script:
```powershell
.\start_backend.ps1
```

The backend should show:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Solution 2: Check backend is accessible

Open in browser: `http://localhost:8000/health`

You should see JSON response. If you get "connection refused", the backend isn't running.

### Solution 3: Verify CORS configuration

The backend is configured to allow:
- `http://localhost:*` (any port)
- `http://127.0.0.1:*` (any port)

If you're using a different host, update `backend/main.py` CORS settings.

## ModuleNotFoundError: No module named 'uvicorn'

### Solution:

```powershell
# Activate virtual environment
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt
```

Or run:
```powershell
.\install_backend.ps1
```

## Backend won't start

### Check Python version:
```powershell
python --version
```
Should be Python 3.8 or higher.

### Check virtual environment:
```powershell
# Create if missing
python -m venv venv

# Activate
venv\Scripts\Activate.ps1
```

## Frontend can't connect to backend

1. **Check backend is running** on port 8000
2. **Check frontend port** - if it's not 5173/5174, update CORS in `backend/main.py`
3. **Check firewall** - Windows Firewall might be blocking localhost connections
4. **Try 127.0.0.1 instead of localhost** in browser

## Quick Fix Commands

```powershell
# 1. Install/update backend dependencies
.\install_backend.ps1

# 2. Start backend
.\start_backend.ps1

# 3. In another terminal, start frontend
npm run dev
```

## Still having issues?

1. Check both terminals are running (backend + frontend)
2. Verify backend shows: `Uvicorn running on http://0.0.0.0:8000`
3. Test backend directly: `http://localhost:8000/health`
4. Check browser console for specific error messages
5. Make sure no other service is using port 8000

