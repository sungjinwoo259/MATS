# MATS – Mobile Application Threads Simulation

MATS is a web-based workflow (built with Vite + React + shadcn/ui) that lets security teams upload Android APKs, select multiple analysis engines (JADX, APKTool, Quark Engine, AndroGuard, Frida, MITMProxy), watch a guided execution flow, and review consolidated findings, vulnerabilities, remediation suggestions, and export-ready reports.

The application includes a **Python backend** that orchestrates real analysis tools in a virtual environment, providing actual APK analysis capabilities.

---

## 🚀 Quick Start (Windows)

### Step 1: Prerequisites

1. **Node.js 18+** – verify with `node -v`
2. **Python 3.8+** – verify with `python --version`
3. **Java Runtime** (for JADX/APKTool) – verify with `java -version`
4. **Git** (optional but recommended)

### Step 2: Automated Setup

Run the Windows setup script:

```powershell
.\setup_windows.ps1
```

This script will:
- ✅ Check Python, Node.js, and Java
- ✅ Create Python virtual environment
- ✅ Install all Python dependencies
- ✅ Download and configure analysis tools (JADX, APKTool)
- ✅ Set up the backend API

### Step 3: Manual Setup (Alternative)

If you prefer manual setup:

```bash
# Install Node.js dependencies
npm install

# Create Python virtual environment
python -m venv venv
venv\Scripts\activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Setup analysis tools
python backend/tools_setup.py
```

---

## 🏃 Running the Application

### Terminal 1: Start Backend API

```bash
# Activate virtual environment
venv\Scripts\activate

# Start FastAPI server
python backend/main.py
# Or: uvicorn backend.main:app --reload --port 8000
```

Backend will run at: `http://localhost:8000`

### Terminal 2: Start Frontend

```bash
npm run dev
```

Frontend will run at: `http://localhost:5173`

---

## 🛠️ Integrated Analysis Tools

| Tool | Windows Support | Status | Description |
|------|----------------|--------|-------------|
| **JADX** | ✅ Full | ⭐⭐⭐⭐⭐ | APK decompilation to Java/Kotlin |
| **APKTool** | ✅ Full | ⭐⭐⭐⭐ | APK resource decoding and Smali |
| **Quark Engine** | ✅ Full | ⭐⭐⭐⭐ | Malware detection and threat scoring |
| **AndroGuard** | ⚠️ Partial | ⭐⭐⭐ | Deep bytecode and manifest analysis |
| **Frida** | ✅ Full | ⭐⭐⭐⭐⭐ | Runtime instrumentation (requires device) |
| **MITMProxy** | ✅ Full | ⭐⭐⭐⭐⭐ | Network traffic analysis (manual setup) |

### Tool Installation Details

#### Python Tools (Auto-installed)
```bash
pip install mitmproxy androguard frida frida-tools quark-engine objection
```

#### Java Tools (Auto-downloaded)
- **JADX**: Downloaded to `tools/jadx/` (via `tools_setup.py`)
- **APKTool**: Downloaded to `tools/apktool/` (via `tools_setup.py`)

---

## 📥 Manual JADX Installation (Alternative Methods)

> **📖 For detailed installation instructions, see [JADX_INSTALLATION.md](JADX_INSTALLATION.md)**

If the automated setup doesn't work or you prefer manual installation, here are platform-specific methods:

### 🟦 Windows

#### Method 1: Download EXE (Recommended - Easiest)
1. Go to [JADX GitHub Releases](https://github.com/skylot/jadx/releases)
2. Download `jadx-gui-x.y.z.zip` (latest version)
3. Extract the ZIP file
4. Run `jadx-gui.exe`

#### Method 2: Install via Scoop (Best for developers)
```powershell
# Install Scoop (if not installed)
Set-ExecutionPolicy RemoteSigned -scope CurrentUser
iwr -useb get.scoop.sh | iex

# Install JADX
scoop install jadx

# Run JADX
jadx-gui
```

#### Requirements
- **Java Runtime Environment (JRE)** or JDK
  ```powershell
  winget install Oracle.JavaRuntimeEnvironment
  ```

### 🟩 Linux (Ubuntu/Kali/Debian)

#### Method 1: Install via Snap (Easiest)
```bash
sudo snap install jadx
jadx-gui
```

#### Method 2: Manual Installation
```bash
# Download latest version from GitHub
wget https://github.com/skylot/jadx/releases/download/v1.5.0/jadx-1.5.0.zip

# Extract
unzip jadx-1.5.0.zip
cd jadx-1.5.0/bin

# Run
./jadx-gui
```

#### Requirements
```bash
sudo apt install default-jre
```

### 🟪 macOS

#### Install via Homebrew
```bash
brew install jadx
jadx-gui
```

### ✅ Verify Installation
```bash
jadx --version
```

---

## 📁 Project Structure

```
mats/
├─ backend/
│  ├─ main.py              # FastAPI backend server
│  ├─ tools_setup.py       # Tool installation script
│  ├─ requirements.txt    # Python dependencies
│  └─ README.md            # Backend documentation
├─ src/
│  ├─ App.tsx              # Main React component
│  ├─ lib/
│  │  ├─ api.ts            # Backend API client
│  │  └─ utils.ts          # Utility functions
│  ├─ components/ui/      # shadcn/ui components
│  └─ index.css            # Tailwind styles
├─ tools/                   # Downloaded analysis tools
├─ uploads/                 # Uploaded APK files
├─ results/                 # Analysis results
├─ venv/                    # Python virtual environment
├─ setup_windows.ps1        # Windows setup script
└─ package.json            # Node.js dependencies
```

---

## 🔌 API Endpoints

The backend provides the following endpoints:

- `GET /` - API information
- `GET /health` - Health check and tool availability
- `POST /upload` - Upload APK file
- `POST /analyze` - Start analysis workflow
- `GET /status/{apk_id}` - Get analysis status
- `GET /results/{apk_id}` - Get analysis results
- `GET /download/{apk_id}/{tool}` - Download tool-specific results

---

## 💻 Development Workflow

### Frontend Development

```bash
npm run dev
```

- Vite boots on `http://localhost:5173`
- Hot Module Replacement for instant updates

### Backend Development

```bash
venv\Scripts\activate
python backend/main.py
```

- FastAPI with auto-reload on code changes
- API docs at `http://localhost:8000/docs`

### Build for Production

```bash
# Frontend
npm run build

# Backend (no build needed, just deploy)
# Deploy dist/ folder and backend/ folder
```

---

## 🎨 Using the UI

1. **Upload Flow**: Select an APK file → automatically uploads to backend
2. **Analysis Options**: Choose tools (JADX recommended, others optional)
3. **Progress Tracking**: Real-time status updates from backend
4. **Results View**: Consolidated findings, vulnerabilities, and remediation suggestions
5. **Export**: Download detailed reports (PDF export coming soon)

---

## ⚠️ Troubleshooting

| Issue | Fix |
|-------|-----|
| `npm install` fails on Windows | Run PowerShell as admin: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| Backend not connecting | Ensure backend is running: `python backend/main.py` |
| JADX/APKTool not found | Run `python backend/tools_setup.py` to download tools, or see [JADX_INSTALLATION.md](JADX_INSTALLATION.md) for manual installation |
| Python tools fail to install | Install Microsoft C++ Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/ |
| Java not found | Install via: `winget install Oracle.JavaRuntimeEnvironment` |
| Port 8000 already in use | Change port in `backend/main.py` or kill existing process |

---

## 🔧 Configuration

### Environment Variables

Create `.env` file in project root:

```env
VITE_API_URL=http://localhost:8000
```

### Backend Configuration

Edit `backend/main.py` to:
- Change port (default: 8000)
- Adjust timeout values
- Configure tool paths

---

## 📝 Next Steps

1. ✅ Connect upload + analysis to backend (DONE)
2. 🔄 Replace mock data with real backend responses (DONE)
3. 📊 Add analysis history persistence
4. 🔐 Add authentication/role-based access
5. 📄 Implement PDF report generation
6. 🐳 Docker containerization for easier deployment

---

## 📚 Additional Resources

- [Backend API Documentation](backend/README.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Vite Documentation](https://vite.dev/)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is open source and available for use.

---

**Happy testing!** 🚀
