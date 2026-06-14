@echo off
:: ═══════════════════════════════════════════════════════════════
::  Mentor AI — One-click setup for Windows
::  Run ONCE as Administrator (right-click → Run as administrator)
:: ═══════════════════════════════════════════════════════════════

echo.
echo ═══════════════════════════════════════════════════
echo    Mentor AI — Setup (Windows)
echo    This runs once. It may take 10-20 minutes.
echo ═══════════════════════════════════════════════════
echo.

cd /d "%~dp0"

:: ── Check winget ────────────────────────────────────────────────
where winget >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] winget is not available.
    echo.
    echo Please open the Microsoft Store, search for
    echo "App Installer" and install it. Then re-run this script.
    echo.
    pause
    exit /b 1
)
echo [OK] winget available

:: ── Python ──────────────────────────────────────────────────────
echo.
echo [->] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [->] Installing Python 3.11...
    winget install --id Python.Python.3.11 -e --accept-package-agreements --accept-source-agreements
    echo [OK] Python installed — reopening PATH...
    refreshenv >nul 2>&1
)
echo [OK] Python ready

:: ── Node.js ─────────────────────────────────────────────────────
echo.
echo [->] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [->] Installing Node.js LTS...
    winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
)
echo [OK] Node.js ready

:: ── ffmpeg ──────────────────────────────────────────────────────
echo.
echo [->] Checking ffmpeg (needed for YouTube/audio)...
where ffmpeg >nul 2>&1
if %errorlevel% neq 0 (
    echo [->] Installing ffmpeg...
    winget install --id Gyan.FFmpeg -e --accept-package-agreements --accept-source-agreements
)
echo [OK] ffmpeg ready

:: ── Docker Desktop ──────────────────────────────────────────────
echo.
echo [->] Checking Docker Desktop (needed for the database)...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [->] Docker Desktop not found — installing now...
    echo     This download is ~600 MB, please wait...
    winget install --id Docker.DockerDesktop -e --accept-package-agreements --accept-source-agreements
    echo.
    echo [!] Docker Desktop was just installed.
    echo     Please do the following before continuing:
    echo.
    echo     1. Press any key to close this window
    echo     2. Restart your computer
    echo     3. After restart, open Docker Desktop and wait
    echo        until you see the whale icon in the taskbar
    echo     4. Then double-click setup_windows.bat again
    echo.
    pause
    exit /b 0
)
echo [OK] Docker ready

:: ── Python virtual environment ───────────────────────────────────
echo.
echo [->] Setting up Python environment (this takes a few minutes)...
if not exist .venv (
    python -m venv .venv
)
call .venv\Scripts\activate.bat
python -m pip install --quiet --upgrade pip
echo [->] Installing packages...
pip install --quiet -r requirements.txt
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install Python packages.
    echo Check that requirements.txt exists and try again.
    pause
    exit /b 1
)
echo [OK] Python packages installed

:: ── Frontend packages ─────────────────────────────────────────────
echo.
echo [->] Installing frontend packages...
cd frontend
call npm install --silent
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed. Is Node.js installed?
    pause
    exit /b 1
)
cd ..
echo [OK] Frontend packages installed

:: ── Config files ─────────────────────────────────────────────────
echo.
if not exist .env (
    copy .env.example .env >nul
    echo [OK] .env created
) else (
    echo [OK] .env already exists
)
if not exist frontend\.env.local (
    copy frontend\.env.local.example frontend\.env.local >nul
    echo [OK] frontend\.env.local created
) else (
    echo [OK] frontend\.env.local already exists
)

:: ── Done ─────────────────────────────────────────────────────────
echo.
echo ═══════════════════════════════════════════════════
echo    Setup complete!
echo ═══════════════════════════════════════════════════
echo.
echo    Every time you want to use the app:
echo    Double-click start_windows.bat
echo.
echo    Make sure Docker Desktop is running before starting.
echo.
pause
