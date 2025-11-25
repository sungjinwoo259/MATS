# Frontend-Backend Connection Check

## Current Configuration

### Frontend API Client (`src/lib/api.ts`)
- **Base URL**: `http://localhost:8000` (default)
- **Configurable via**: `VITE_API_URL` environment variable
- **Endpoints Used**:
  - `GET /health` - Health check
  - `POST /upload` - Upload APK
  - `POST /analyze` - Start analysis
  - `GET /status/{apk_id}` - Get status
  - `GET /results/{apk_id}` - Get results

### Backend CORS (`backend/main.py`)
- **Allowed Origins**: Regex pattern matching `http://localhost:*` and `http://127.0.0.1:*`
- **Methods**: All methods (`*`)
- **Headers**: All headers (`*`)
- **Credentials**: Enabled

## Connection Status Check

### Quick Test

1. **Check if backend is running**:
   ```powershell
   netstat -ano | findstr ":8000.*LISTENING"
   ```

2. **Test backend directly**:
   ```powershell
   curl http://localhost:8000/health
   ```

3. **Test from browser**:
   - Open `test_connection.html` in your browser
   - It will automatically test all endpoints

### Frontend Connection Indicator

The frontend shows a connection status indicator:
- 🟢 **Green dot** = Backend Connected
- 🔴 **Red dot** = Backend Offline

This is checked:
- On page load
- Every 10 seconds automatically
- When uploading files
- When starting analysis

## Common Issues

### Issue 1: Backend Not Running
**Symptoms**: Red dot, "Backend Offline" message
**Fix**: Start backend with `python backend/main.py`

### Issue 2: CORS Errors
**Symptoms**: Browser console shows CORS errors
**Fix**: 
- Restart backend (CORS changes require restart)
- Check backend terminal for errors
- Verify CORS regex in `backend/main.py` line 25

### Issue 3: Wrong Port
**Symptoms**: Connection fails but backend is running
**Fix**: 
- Check backend is on port 8000
- Or set `VITE_API_URL` in `.env` file to match backend port

### Issue 4: Network Error
**Symptoms**: "Cannot connect to backend" error
**Fix**:
- Check Windows Firewall
- Verify backend is listening on `0.0.0.0:8000` (not just `127.0.0.1`)
- Check if another service is using port 8000

## Testing Connection

### Method 1: Use Test HTML File
```bash
# Open in browser
start test_connection.html
```

### Method 2: Browser Console
```javascript
// In browser console (F12)
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

### Method 3: PowerShell
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" | Select-Object StatusCode, Content
```

## Verification Checklist

- [ ] Backend is running on port 8000
- [ ] Frontend can reach `http://localhost:8000/health`
- [ ] CORS headers are present in responses
- [ ] Frontend connection indicator shows green
- [ ] No CORS errors in browser console
- [ ] Upload endpoint responds correctly
- [ ] Status polling works during analysis

## Debugging Steps

1. **Check Backend Logs**: Look at backend terminal for errors
2. **Check Browser Console**: F12 → Console tab for errors
3. **Check Network Tab**: F12 → Network tab to see requests/responses
4. **Test Endpoints**: Use `test_connection.html` or curl
5. **Verify CORS**: Check response headers in Network tab

## Expected Behavior

### When Backend is Running:
- Frontend shows green "Backend Connected" indicator
- Health check returns: `{"status": "healthy", "tools": {...}}`
- Upload works without errors
- Analysis can be started

### When Backend is Offline:
- Frontend shows red "Backend Offline" indicator
- Health check fails with network error
- Upload fails with connection error
- Warning messages appear in UI

