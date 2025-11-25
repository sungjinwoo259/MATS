"""
Tool setup and verification script for Windows
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path
import urllib.request
import zipfile
import json

# Fix Windows console encoding for emoji support
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        # Python < 3.7 fallback
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

TOOLS_DIR = Path("tools")
TOOLS_DIR.mkdir(exist_ok=True)


def check_python():
    """Check Python version"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ required")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
    return True


def install_python_package(package: str):
    """Install Python package via pip"""
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", package], check=True)
        print(f"✅ Installed {package}")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Failed to install {package}")
        return False


def download_jadx():
    """Download and setup JADX"""
    jadx_dir = TOOLS_DIR / "jadx"
    if jadx_dir.exists():
        print("✅ JADX already installed")
        return True
    
    print("Downloading JADX...")
    # JADX GitHub releases
    url = "https://github.com/skylot/jadx/releases/download/v1.5.0/jadx-1.5.0.zip"
    zip_path = TOOLS_DIR / "jadx.zip"
    
    try:
        urllib.request.urlretrieve(url, zip_path)
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(TOOLS_DIR)
        zip_path.unlink()
        
        # Rename extracted folder
        extracted = TOOLS_DIR / "jadx-1.5.0"
        if extracted.exists():
            extracted.rename(jadx_dir)
        
        print("✅ JADX installed")
        return True
    except Exception as e:
        print(f"❌ JADX download failed: {e}")
        print("💡 Tip: You can install JADX manually. See JADX_INSTALLATION.md for instructions.")
        print("   Or visit: https://github.com/skylot/jadx/releases")
        return False


def download_apktool():
    """Download and setup APKTool"""
    apktool_dir = TOOLS_DIR / "apktool"
    apktool_dir.mkdir(exist_ok=True)
    
    jar_path = apktool_dir / "apktool.jar"
    if jar_path.exists():
        print("✅ APKTool already installed")
        return True
    
    print("Downloading APKTool...")
    url = "https://bitbucket.org/iBotPeaches/apktool/downloads/apktool_2.9.3.jar"
    
    try:
        urllib.request.urlretrieve(url, jar_path)
        
        # Create batch wrapper
        bat_content = f"""@echo off
java -jar "%~dp0apktool.jar" %*
"""
        bat_path = apktool_dir / "apktool.bat"
        with open(bat_path, "w") as f:
            f.write(bat_content)
        
        print("✅ APKTool installed")
        return True
    except Exception as e:
        print(f"❌ APKTool download failed: {e}")
        return False


def check_java():
    """Check if Java is installed"""
    try:
        result = subprocess.run(["java", "-version"], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Java installed")
            return True
    except:
        pass
    
    print("❌ Java not found. Install Java Runtime Environment:")
    print("   winget install Oracle.JavaRuntimeEnvironment")
    return False


def setup_tools():
    """Main setup function"""
    print("=" * 50)
    print("MATS Tools Setup for Windows")
    print("=" * 50)
    
    if not check_python():
        return False
    
    # Install Python tools
    python_tools = [
        "mitmproxy",
        "androguard",
        "frida",
        "frida-tools",
        "quark-engine",
        "objection",
    ]
    
    print("\n📦 Installing Python tools...")
    for tool in python_tools:
        install_python_package(tool)
    
    # Check Java for JADX/APKTool
    java_available = check_java()
    
    if java_available:
        print("\n📦 Installing Java-based tools...")
        download_jadx()
        download_apktool()
    else:
        print("\n⚠️  Skipping Java tools (JADX, APKTool) - Java not found")
    
    print("\n" + "=" * 50)
    print("Setup complete!")
    print("=" * 50)
    
    return True


if __name__ == "__main__":
    setup_tools()

