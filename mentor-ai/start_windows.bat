@echo off
:: ═══════════════════════════════════════════════════════════════
::  Mentor AI — Start the app (Windows)
::  Double-click this every time you want to use the app.
::  Make sure Docker Desktop is open first!
:: ═══════════════════════════════════════════════════════════════

echo.
echo ═══════════════════════════════════════════════════
echo    Mentor AI — Starting...
echo ═══════════════════════════════════════════════════
echo.

cd /d "%~dp0"

:: ── Auto-update from GitHub ───────────────────────────────────
echo [->] Checking for updates...
git pull origin claude/mentor-ai-data-ingestion-Hy8Dq >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Code is up to date
) else (
    echo [!] Could not check for updates (no internet or git issue - continuing anyway)
)

:: ── Check Docker is running ──────────────────────────────────────
echo [->] Checking Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [!] Docker Desktop is not running.
    echo.
    echo     Please:
    echo     1. Open Docker Desktop from your Start menu
    echo     2. Wait until the whale icon appears in the taskbar
    echo     3. Double-click start_windows.bat again
    echo.
    pause
    exit /b 1
)
echo [OK] Docker is running

:: ── Start Qdrant database ────────────────────────────────────────
echo [->] Starting database (Qdrant)...
docker compose -f docker/docker-compose.yml up -d
echo [OK] Database running

:: ── Start Python backend ─────────────────────────────────────────
echo [->] Starting backend (port 8000)...
call .venv\Scripts\activate.bat
start "Mentor AI — Backend" cmd /k "cd /d "%~dp0" && call .venv\Scripts\activate.bat && uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload"
echo [OK] Backend starting...

:: ── Start Next.js frontend ───────────────────────────────────────
echo [->] Starting frontend (port 3000)...
start "Mentor AI — Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo [OK] Frontend starting...

:: ── Open browser ─────────────────────────────────────────────────
echo.
echo [->] Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo ═══════════════════════════════════════════════════
echo    App is open at: http://localhost:3000
echo ═══════════════════════════════════════════════════
echo.
echo    Two windows opened: Backend and Frontend.
echo    Keep them both open while using the app.
echo    To stop: close both windows, then run:
echo      docker compose -f docker/docker-compose.yml down
echo.
pause
