@echo off
title NeuroFusionAI - Launcher
color 0B
cls

echo =====================================================================
echo              NEUROFUSIONAI MULTIMODAL DIAGNOSTIC SYSTEM
echo =====================================================================
echo.
echo [*] Checking working directory...
cd /d "%~dp0"
echo Current directory: %CD%
echo.

echo [*] Freeing ports 8000 and 5173 if currently occupied...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [*] Launching FastAPI Backend on http://127.0.0.1:8000...
start "NeuroFusionAI Backend [Port 8000]" cmd /k "cd /d ""%~dp0"" && title NeuroFusion Backend (Port 8000) && color 0A && echo Starting FastAPI Backend Server... && .venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000"

echo [*] Waiting 3 seconds for Backend models to initialize...
ping 127.0.0.1 -n 4 >nul

echo [*] Launching Vite React Frontend on http://localhost:5173...
start "NeuroFusionAI Frontend [Port 5173]" cmd /k "cd /d ""%~dp0frontend"" && title NeuroFusion Frontend (Port 5173) && color 0E && echo Starting React Vite Dev Server... && npm run dev"

echo [*] Waiting 3 seconds for Vite server...
ping 127.0.0.1 -n 4 >nul

echo [*] Opening NeuroFusionAI in your default browser...
start http://localhost:5173

echo.
echo =====================================================================
echo  STATUS: Both servers have been launched in dedicated CMD windows!
echo.
echo  - Frontend React UI:   http://localhost:5173/
echo  - Backend API:         http://127.0.0.1:8000/
echo  - Direct Diagnostics:  http://127.0.0.1:8000/diagnostic-tool
echo  - Swagger API Docs:    http://127.0.0.1:8000/docs
echo =====================================================================
echo.
echo Launcher complete. Both servers are active.

