# Quick Fix: "Failed to upload APK" Error

## ✅ Backend is Running
Your backend is running on port 8000 and responding to health checks.

## 🔧 Steps to Fix

### Step 1: Restart the Backend
The CORS configuration was updated, so you need to restart the backend:

1. **Stop the current backend** (press `Ctrl+C` in the backend terminal)
2. **Start it again**:
   ```powershell
   venv\Scripts\Activate.ps1
   python backend/main.py
   ```

Or use the helper script:
```powershell
.\start_backend.ps1
```

### Step 2: Verify Backend is Running
You should see in the backend terminal:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Step 3: Check Frontend Connection
1. **Refresh your browser** (hard refresh: `Ctrl+Shift+R`)
2. **Look for the connection indicator** in the top-left of the page:
   - 🟢 Green dot = Backend Connected
   - 🔴 Red dot = Backend Offline

### Step 4: Test Upload
1. Try uploading an APK file again
2. Check the browser console (F12) for any error messages
3. Check the backend terminal for any error logs

## 🔍 If Still Not Working

### Check Browser Console
Open Developer Tools (F12) and look for:
- CORS errors
- Network errors
- Specific error messages

### Check Backend Logs
Look in the backend terminal for:
- Error messages
- Request logs
- Any exceptions

### Test Backend Directly
Run the diagnostic script:
```powershell
.\test_backend.ps1
```

### Common Issues

1. **Backend not restarted after CORS changes**
   - Solution: Restart the backend

2. **File too large**
   - Solution: Check backend terminal for file size errors

3. **Wrong file type**
   - Solution: Make sure you're uploading a `.apk` file

4. **Firewall blocking**
   - Solution: Check Windows Firewall settings

5. **Port conflict**
   - Solution: Make sure nothing else is using port 8000

## 📝 What Was Fixed

1. ✅ CORS now allows `http://localhost:5174` (and any localhost port)
2. ✅ Better error messages in the frontend
3. ✅ Connection status indicator added to UI
4. ✅ Improved error handling in API client

## 🆘 Still Having Issues?

1. Check both terminals are running (backend + frontend)
2. Verify backend shows: `Uvicorn running on http://0.0.0.0:8000`
3. Test backend: Open `http://localhost:8000/health` in browser
4. Check browser console for specific errors
5. Check backend terminal for error logs

