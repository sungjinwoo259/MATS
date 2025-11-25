# JADX Installation Guide

This guide provides multiple methods to install JADX on Windows, Linux, and macOS. Choose the method that works best for your system.

---

## 🟦 Windows Installation

### ✅ Method 1: Download EXE (Recommended - Easiest)

**Best for:** Users who want the simplest installation

1. **Go to GitHub releases:**
   - Visit: https://github.com/skylot/jadx/releases
   - Or search: "jadx GitHub releases"

2. **Download:**
   - Download `jadx-gui-x.y.z.zip` (latest version)
   - Example: `jadx-gui-1.5.0.zip`

3. **Extract the ZIP file** to any location

4. **Run:**
   - Double-click `jadx-gui.exe`
   - Or run from command line: `jadx-gui.exe`

**That's it!** This is the easiest and fastest method.

---

### ✅ Method 2: Install using Scoop (Best for developers)

**Best for:** Developers who use package managers

If you use Scoop package manager:

1. **Install Scoop (if not installed):**
   ```powershell
   Set-ExecutionPolicy RemoteSigned -scope CurrentUser
   iwr -useb get.scoop.sh | iex
   ```

2. **Install JADX:**
   ```powershell
   scoop install jadx
   ```

3. **Run JADX:**
   ```powershell
   jadx-gui
   ```

---

### ⚠️ Requirements for Windows

**Java Runtime Environment (JRE)** or JDK is required.

**Install Java using Winget:**
```powershell
winget install Oracle.JavaRuntimeEnvironment
```

**Or download from:**
- https://www.oracle.com/java/technologies/downloads/

---

## 🟩 Linux Installation (Ubuntu/Kali/Debian)

### ✅ Method 1: Install via Snap (Easiest)

**Best for:** Ubuntu/Kali users who want quick installation

```bash
sudo snap install jadx
```

**Run:**
```bash
jadx-gui
```

---

### ✅ Method 2: Manual Installation

**Best for:** Users who want control over installation location

```bash
# Download latest version (replace version number with latest)
wget https://github.com/skylot/jadx/releases/download/v1.5.0/jadx-1.5.0.zip

# Extract
unzip jadx-1.5.0.zip

# Navigate to bin directory
cd jadx-1.5.0/bin

# Run
./jadx-gui
```

**Or add to PATH:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="$PATH:/path/to/jadx-1.5.0/bin"

# Then run from anywhere
jadx-gui
```

---

### ⚠️ Requirements for Linux

**Install Java Runtime:**
```bash
# Ubuntu/Debian
sudo apt install default-jre

# Or install JDK
sudo apt install default-jdk
```

---

## 🟪 macOS Installation

### ✅ Install using Homebrew

**Best for:** macOS users with Homebrew

```bash
brew install jadx
```

**Run GUI:**
```bash
jadx-gui
```

**Or run CLI:**
```bash
jadx
```

---

## ✅ Verify Installation

Check if JADX is installed correctly:

```bash
# Check version
jadx --version

# Or
jadx-gui --version
```

---

## 🔧 Integration with MATS Backend

If you installed JADX manually (not via `tools_setup.py`), you may need to:

1. **Add JADX to PATH** (recommended)
   - Windows: Add JADX bin directory to System PATH
   - Linux/Mac: Add to `~/.bashrc` or `~/.zshrc`

2. **Or update backend configuration**
   - Edit `backend/main.py`
   - Update the `get_tool_path()` function to point to your JADX installation

3. **Verify backend can find JADX:**
   ```bash
   # Check health endpoint
   curl http://localhost:8000/health
   ```

---

## 🆘 Troubleshooting

### JADX not found by backend

**Solution 1:** Add to PATH
```bash
# Windows PowerShell
$env:Path += ";C:\path\to\jadx\bin"

# Linux/Mac
export PATH="$PATH:/path/to/jadx/bin"
```

**Solution 2:** Update backend tool path
- Edit `backend/main.py`
- Modify `get_tool_path()` function

### Java not found

**Windows:**
```powershell
winget install Oracle.JavaRuntimeEnvironment
```

**Linux:**
```bash
sudo apt install default-jre
```

**macOS:**
```bash
brew install openjdk
```

### Permission denied (Linux/Mac)

```bash
chmod +x /path/to/jadx/bin/jadx-gui
```

---

## 📚 Additional Resources

- **JADX GitHub:** https://github.com/skylot/jadx
- **JADX Releases:** https://github.com/skylot/jadx/releases
- **JADX Documentation:** https://github.com/skylot/jadx/wiki

---

## 💡 Quick Reference

| OS | Easiest Method | Command |
|---|---|---|
| **Windows** | Download EXE | Download ZIP, extract, run `jadx-gui.exe` |
| **Windows** | Scoop | `scoop install jadx` |
| **Linux** | Snap | `sudo snap install jadx` |
| **Linux** | Manual | Download ZIP, extract, run `./jadx-gui` |
| **macOS** | Homebrew | `brew install jadx` |

---

**Need help?** Check the main [README.md](README.md) or open an issue on GitHub.

