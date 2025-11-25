"""
MATS Backend API - Orchestrates analysis tools for Android APK analysis
"""
import os
import shutil
import subprocess
import asyncio
import sys
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
import json
import uuid
from datetime import datetime

app = FastAPI(title="MATS API", version="1.0.0")

# CORS middleware for React frontend
# Allow all localhost ports for development using regex
# In production, replace with specific origins
# Note: 0.0.0.0 is removed as browsers never send it as an origin (it's server-only)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOAD_DIR = Path("uploads")
RESULTS_DIR = Path("results")
TEMP_DIR = Path("temp_apks")
UPLOAD_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)

# Tool paths (will be set by environment or auto-detected)
def get_tool_path(tool_name: str) -> str:
    """Get tool path, checking PATH first, then local installation"""
    # Check PATH first (try both .exe and .cmd/.bat on Windows)
    path_tool = shutil.which(tool_name)
    if path_tool:
        return path_tool
    
    # On Windows, also check for .cmd and .bat variants in PATH
    if sys.platform == "win32":
        for ext in [".cmd", ".bat", ".exe"]:
            path_tool = shutil.which(f"{tool_name}{ext}")
            if path_tool:
                return path_tool
    
    # Check local installation paths (try multiple possible locations)
    local_paths = {
        "jadx": [
            Path("tools/jadx/bin/jadx.bat"),  # Expected location
            Path("tools/bin/jadx.bat"),       # Alternative location (if extracted directly)
            Path.home() / "scoop" / "shims" / "jadx.cmd",  # Scoop installation
            Path.home() / "scoop" / "apps" / "jadx" / "current" / "bin" / "jadx.bat",  # Scoop app path
        ],
        "apktool": [Path("tools/apktool/apktool.bat")],
    }
    
    if tool_name in local_paths:
        for local_path in local_paths[tool_name]:
            if local_path.exists():
                return str(local_path)
    
    # Fallback to command name (will fail if not in PATH)
    return tool_name

TOOLS = {
    "jadx": get_tool_path("jadx"),
    "apktool": get_tool_path("apktool"),
    "quark": "quark",
    "mitmproxy": shutil.which("mitmproxy") or "mitmproxy",
    "androguard": "androguard",
    "frida": shutil.which("frida") or "frida",
    "objection": shutil.which("objection") or "objection",
}


class AnalysisRequest(BaseModel):
    apk_id: str
    tools: List[str]


class AnalysisStatus(BaseModel):
    apk_id: str
    status: str  # "pending", "processing", "completed", "failed"
    progress: int
    current_tool: Optional[str] = None
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# In-memory status store (use Redis/DB in production)
analysis_status: Dict[str, AnalysisStatus] = {}


def check_tool_available(tool: str) -> bool:
    """Check if a tool is available in the system"""
    if tool == "jadx":
        # Check PATH first (includes Scoop installations)
        if shutil.which("jadx") is not None:
            return True
        # Check local installation paths
        if Path("tools/jadx/bin/jadx.bat").exists():
            return True
        if Path("tools/bin/jadx.bat").exists():
            return True
        # Check Scoop installation path directly
        scoop_path = Path.home() / "scoop" / "shims" / "jadx.cmd"
        if scoop_path.exists():
            return True
        return False
    elif tool == "apktool":
        return shutil.which("apktool") is not None or Path("tools/apktool/apktool.bat").exists()
    else:
        try:
            result = subprocess.run(
                [tool, "--version"] if tool != "quark" else ["quark", "--help"],
                capture_output=True,
                timeout=5,
            )
            return result.returncode == 0
        except:
            return False


async def run_jadx(apk_path: Path, output_dir: Path) -> Dict[str, Any]:
    """Run JADX decompilation"""
    try:
        # Get JADX path dynamically (don't rely on TOOLS dict which is set at module load)
        jadx_cmd = get_tool_path("jadx")
        if not check_tool_available("jadx"):
            return {"error": "JADX not found. Please install JADX."}
        
        # If jadx_cmd is just "jadx", verify it's actually available
        if jadx_cmd == "jadx" and shutil.which("jadx") is None:
            return {"error": "JADX not found in PATH. Please install JADX or restart the backend."}
        
        cmd = [jadx_cmd, "-d", str(output_dir), str(apk_path)]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            return {
                "status": "success",
                "output_dir": str(output_dir),
                "message": "Decompilation completed",
            }
        else:
            return {"error": f"JADX failed: {result.stderr}"}
    except Exception as e:
        return {"error": str(e)}


async def run_apktool(apk_path: Path, output_dir: Path) -> Dict[str, Any]:
    """Run APKTool decode"""
    try:
        apktool_cmd = TOOLS["apktool"]
        if not check_tool_available("apktool"):
            return {"error": "APKTool not found. Please install APKTool."}
        
        cmd = [apktool_cmd, "d", str(apk_path), "-o", str(output_dir), "-f"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            manifest_path = output_dir / "AndroidManifest.xml"
            return {
                "status": "success",
                "output_dir": str(output_dir),
                "manifest_exists": manifest_path.exists(),
                "message": "APK decoded successfully",
            }
        else:
            return {"error": f"APKTool failed: {result.stderr}"}
    except Exception as e:
        return {"error": str(e)}


async def run_quark(apk_path: Path) -> Dict[str, Any]:
    """Run Quark Engine analysis"""
    try:
        if not check_tool_available("quark"):
            return {"error": "Quark Engine not found. Install with: pip install quark-engine"}

        # Ensure Quark rules are available (quark --setup downloads them once)
        rules_path = Path.home() / ".quark-engine" / "quark-rules" / "rules"
        if not rules_path.exists():
            try:
                setup = subprocess.run(
                    ["quark", "--setup"],
                    capture_output=True,
                    text=True,
                    timeout=180,
                )
                if setup.returncode != 0 or not rules_path.exists():
                    return {
                        "error": "Quark rules are missing and automatic setup failed. "
                        "Run `quark --setup` manually to download rules.",
                        "details": setup.stderr or setup.stdout,
                    }
            except subprocess.TimeoutExpired:
                return {
                    "error": "Quark rules download timed out. Run `quark --setup` manually."
                }
            except Exception as setup_error:
                return {
                    "error": f"Failed to prepare Quark rules: {setup_error}. "
                    "Run `quark --setup` manually.",
                }
        
        cmd = ["quark", "-a", str(apk_path), "-s", "-o", "json"]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            try:
                json_output = json.loads(result.stdout)
                return {
                    "status": "success",
                    "threats": json_output.get("threats", []),
                    "score": json_output.get("score", 0),
                    "message": "Quark analysis completed",
                }
            except:
                return {
                    "status": "success",
                    "raw_output": result.stdout,
                    "message": "Quark analysis completed",
                }
        else:
            return {"error": f"Quark failed: {result.stderr}"}
    except Exception as e:
        return {"error": str(e)}


async def run_androguard(apk_path: Path) -> Dict[str, Any]:
    """Run AndroGuard analysis"""
    try:
        if not check_tool_available("androguard"):
            return {"error": "AndroGuard not found. Install with: pip install androguard"}
        
        # Use androguard command-line tool
        cmd = ["androguard", "analyze", str(apk_path)]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        except subprocess.TimeoutExpired:
            return {
                "error": "AndroGuard timed out after 600 seconds. The APK may be very large or complex."
            }
        
        if result.returncode == 0:
            return {
                "status": "success",
                "output": result.stdout,
                "message": "AndroGuard analysis completed",
            }
        else:
            return {"error": f"AndroGuard failed: {result.stderr or result.stdout}"}
    except Exception as e:
        return {"error": str(e)}


async def run_analysis_workflow(apk_id: str, apk_path: Path, tools: List[str]):
    """Execute analysis workflow for selected tools"""
    status = analysis_status.get(apk_id)
    if not status:
        return
    
    status.status = "processing"
    status.progress = 0
    results = {}
    has_critical_errors = False
    unknown_tools = []
    pending_only_tools = {"frida", "mitmproxy"}  # Tools that require external setup
    tools_with_actual_analysis = []  # Track tools that actually performed analysis
    
    total_tools = len(tools)
    output_base = RESULTS_DIR / apk_id
    output_base.mkdir(exist_ok=True)
    
    for idx, tool in enumerate(tools):
        status.current_tool = tool
        analysis_status[apk_id] = status  # Update status before starting tool
        
        try:
            if tool == "jadx":
                output_dir = output_base / "jadx_output"
                result = await run_jadx(apk_path, output_dir)
                results["jadx"] = result
                tools_with_actual_analysis.append(tool)
                if "error" in result:
                    has_critical_errors = True
            elif tool == "apktool":
                output_dir = output_base / "apktool_output"
                result = await run_apktool(apk_path, output_dir)
                results["apktool"] = result
                tools_with_actual_analysis.append(tool)
                if "error" in result:
                    has_critical_errors = True
            elif tool == "quark":
                result = await run_quark(apk_path)
                results["quark"] = result
                tools_with_actual_analysis.append(tool)
                if "error" in result:
                    has_critical_errors = True
            elif tool == "androguard":
                result = await run_androguard(apk_path)
                results["androguard"] = result
                tools_with_actual_analysis.append(tool)
                if "error" in result:
                    has_critical_errors = True
            elif tool == "frida":
                results["frida"] = {
                    "status": "pending",
                    "message": "Frida requires device connection. Use objection for runtime analysis.",
                }
            elif tool == "mitmproxy":
                results["mitmproxy"] = {
                    "status": "pending",
                    "message": "MITMProxy requires active proxy setup. Configure manually for network analysis.",
                }
            else:
                unknown_tools.append(tool)
                results[tool] = {"error": f"Unknown tool: {tool}"}
                has_critical_errors = True
        except Exception as e:
            results[tool] = {"error": str(e)}
            has_critical_errors = True
        
        # Update progress after tool completion: (idx + 1) / total_tools
        # This ensures first tool shows progress (e.g., 33% for 3 tools) rather than 0%
        status.progress = int(((idx + 1) / total_tools) * 100)
        analysis_status[apk_id] = status  # Update status after tool completes
        await asyncio.sleep(0.5)  # Small delay for UI updates
    
    status.progress = 100
    status.current_tool = None
    
    # Check if only pending-only tools were selected (no actual analysis performed)
    if not tools_with_actual_analysis and all(tool in pending_only_tools for tool in tools):
        has_critical_errors = True
        error_messages = [
            "No actual analysis was performed. Selected tools (frida, mitmproxy) require external setup and cannot run automatically."
        ]
        status.status = "failed"
        status.error = "; ".join(error_messages)
    # Set status based on results
    elif has_critical_errors:
        error_messages = []
        if unknown_tools:
            error_messages.append(f"Unknown tools: {', '.join(unknown_tools)}")
        for tool, result in results.items():
            if isinstance(result, dict) and "error" in result:
                error_messages.append(f"{tool}: {result['error']}")
        
        status.status = "failed"
        status.error = "; ".join(error_messages) if error_messages else "Analysis failed with errors"
    else:
        status.status = "completed"
    
    status.results = results


@app.get("/")
async def root():
    return {"message": "MATS API", "version": "1.0.0"}


@app.get("/health")
async def health():
    """Check API health and tool availability"""
    tools_status = {}
    for tool in ["jadx", "apktool", "quark", "androguard", "frida", "mitmproxy"]:
        tools_status[tool] = check_tool_available(tool)
    
    return {
        "status": "healthy",
        "tools": tools_status,
    }


@app.post("/upload")
async def upload_apk(file: UploadFile = File(...)):
    """Upload APK file"""
    if not file.filename.endswith(".apk"):
        raise HTTPException(status_code=400, detail="File must be an APK")
    
    apk_id = str(uuid.uuid4())
    apk_path = UPLOAD_DIR / f"{apk_id}.apk"
    
    with open(apk_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Initialize status
    analysis_status[apk_id] = AnalysisStatus(
        apk_id=apk_id,
        status="pending",
        progress=0,
    )
    
    return {
        "apk_id": apk_id,
        "filename": file.filename,
        "size": len(content),
        "message": "APK uploaded successfully",
    }


@app.post("/analyze")
async def start_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """Start analysis workflow"""
    apk_id = request.apk_id
    apk_path = UPLOAD_DIR / f"{apk_id}.apk"
    
    if not apk_path.exists():
        raise HTTPException(status_code=404, detail="APK not found")
    
    if apk_id not in analysis_status:
        raise HTTPException(status_code=404, detail="Analysis not initialized")
    
    # Start background task
    background_tasks.add_task(run_analysis_workflow, apk_id, apk_path, request.tools)
    
    return {
        "apk_id": apk_id,
        "status": "started",
        "tools": request.tools,
    }


@app.get("/status/{apk_id}")
async def get_status(apk_id: str):
    """Get analysis status"""
    if apk_id not in analysis_status:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return analysis_status[apk_id]


@app.get("/results/{apk_id}")
async def get_results(apk_id: str):
    """Get analysis results"""
    if apk_id not in analysis_status:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    status = analysis_status[apk_id]
    if status.status != "completed":
        raise HTTPException(status_code=400, detail="Analysis not completed")
    
    return {
        "apk_id": apk_id,
        "results": status.results,
        "generated_at": datetime.now().isoformat(),
    }


@app.get("/download/{apk_id}/{tool}")
async def download_results(apk_id: str, tool: str):
    """Download analysis results for a specific tool"""
    output_base = RESULTS_DIR / apk_id
    if tool == "jadx":
        zip_path = output_base / "jadx_output.zip"
        if zip_path.exists():
            return FileResponse(zip_path, filename=f"{apk_id}_jadx.zip")
    elif tool == "apktool":
        zip_path = output_base / "apktool_output.zip"
        if zip_path.exists():
            return FileResponse(zip_path, filename=f"{apk_id}_apktool.zip")
    
    raise HTTPException(status_code=404, detail="Results not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

