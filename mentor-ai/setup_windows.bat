@echo off
:: ═══════════════════════════════════════════════════════════════
::  Mentor AI — One-click setup for Windows
::  Run once: double-click setup_windows.bat  (as Administrator)
:: ═══════════════════════════════════════════════════════════════

echo.
echo ═══════════════════════════════════════════════════
echo    Mentor AI — Setup (Windows)
echo ═══════════════════════════════════════════════════
echo.

:: ── Check winget ────────────────────────────────────────────────
where winget >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] winget is not available.
    echo Please update Windows or install App Installer from the Microsoft Store.
    pause
    exit /b 1
)
echo [OK] winget available

:: ── Python ──────────────────────────────────────────────────────
echo [->] Checking Python...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [->] Installing Python...
    winget install --id Python.Python.3.11 -e --silent
)
echo [OK] Python ready

:: ── Node.js ─────────────────────────────────────────────────────
echo [->] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [->] Installing Node.js...
    winget install --id OpenJS.NodeJS.LTS -e --silent
)
echo [OK] Node.js ready

:: ── ffmpeg ──────────────────────────────────────────────────────
echo [->] Checking ffmpeg...
where ffmpeg >nul 2>&1
if %errorlevel% neq 0 (
    echo [->] Installing ffmpeg...
    winget install --id Gyan.FFmpeg -e --silent
)
echo [OK] ffmpeg ready

:: ── Docker Desktop ──────────────────────────────────────────────
echo [->] Checking Docker...
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Docker Desktop is not installed.
    echo Please install it from: https://www.docker.com/products/docker-desktop/
    echo After installing, re-run this script.
    echo.
    pause
    exit /b 1
)
echo [OK] Docker ready

:: ── Python environment ───────────────────────────────────────────
echo [->] Setting up Python environment...
cd /d "%~dp0"
python -m venv .venv
call .venv\Scripts\activate.bat
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo [OK] Python packages installed

:: ── Frontend ─────────────────────────────────────────────────────
echo [->] Installing frontend packages...
cd frontend
call npm install --silent
cd ..
echo [OK] Frontend packages installed

:: ── .env files ───────────────────────────────────────────────────
if not exist .env (
    copy .env.example .env >nul
    echo [OK] .env created
)
if not exist frontend\.env.local (
    copy frontend\.env.local.example frontend\.env.local >nul
    echo [OK] frontend\.env.local created
)

echo.
echo ═══════════════════════════════════════════════════
echo    Setup complete!
echo ═══════════════════════════════════════════════════
echo.
echo    To start the app, double-click:  start_windows.bat
echo.
pause
