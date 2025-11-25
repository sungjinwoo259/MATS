# MATS Backend API

Backend service for orchestrating Android APK analysis tools.

## Tools Integrated

- **JADX** - APK decompilation to Java/Kotlin
- **APKTool** - APK resource decoding and modification
- **Quark Engine** - Malware detection and threat scoring
- **AndroGuard** - Deep bytecode and manifest analysis
- **MITMProxy** - Network traffic analysis (requires manual setup)
- **Frida** - Runtime instrumentation (requires device connection)

## Setup

### Windows

1. Run the setup script:
```powershell
.\setup_windows.ps1
```

2. Or manually:
```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Setup tools
python backend/tools_setup.py
```

### Manual Tool Installation

#### JADX
- Download from: https://github.com/skylot/jadx/releases
- Extract to `tools/jadx/`
- Add to PATH or use full path

#### APKTool
- Download `apktool.jar` from: https://ibotpeaches.github.io/Apktool/
- Place in `tools/apktool/`
- Requires Java Runtime

#### Python Tools
```bash
pip install mitmproxy androguard frida frida-tools quark-engine objection
```

## Running the API

```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Start server
python backend/main.py
# Or with uvicorn directly
uvicorn backend.main:app --reload --port 8000
```

API will be available at: `http://localhost:8000`

## API Endpoints

- `GET /` - API info
- `GET /health` - Health check and tool availability
- `POST /upload` - Upload APK file
- `POST /analyze` - Start analysis workflow
- `GET /status/{apk_id}` - Get analysis status
- `GET /results/{apk_id}` - Get analysis results
- `GET /download/{apk_id}/{tool}` - Download tool-specific results

## Example Usage

```python
import requests

# Upload APK
with open("app.apk", "rb") as f:
    response = requests.post("http://localhost:8000/upload", files={"file": f})
    apk_id = response.json()["apk_id"]

# Start analysis
requests.post("http://localhost:8000/analyze", json={
    "apk_id": apk_id,
    "tools": ["jadx", "quark", "androguard"]
})

# Check status
status = requests.get(f"http://localhost:8000/status/{apk_id}").json()

# Get results
results = requests.get(f"http://localhost:8000/results/{apk_id}").json()
```

## Notes

- Frida and MITMProxy require additional device/network setup
- Large APKs may take several minutes to analyze
- Results are stored in `results/` directory
- Uploaded APKs are stored in `uploads/` directory

