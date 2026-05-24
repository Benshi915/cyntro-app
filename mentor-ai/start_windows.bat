@echo off
:: ═══════════════════════════════════════════════════════════════
::  Mentor AI — Start all services (Windows)
::  Double-click every time you want to use the app
:: ═══════════════════════════════════════════════════════════════

echo.
echo ═══════════════════════════════════════════════════
echo    Mentor AI — Starting
echo ═══════════════════════════════════════════════════
echo.

cd /d "%~dp0"

:: ── 1. Qdrant ────────────────────────────────────────────────────
echo [->] Starting Qdrant (database)...
docker compose -f docker/docker-compose.yml up -d
echo [OK] Qdrant running

:: ── 2. Python backend ────────────────────────────────────────────
echo [->] Starting Python backend...
call .venv\Scripts\activate.bat
start "Mentor AI — Backend" cmd /k "uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload"
echo [OK] Backend starting on port 8000

:: ── 3. Frontend ──────────────────────────────────────────────────
echo [->] Starting frontend...
cd frontend
start "Mentor AI — Frontend" cmd /k "npm run dev"
cd ..
echo [OK] Frontend starting on port 3000

:: ── 4. Wait + open browser ───────────────────────────────────────
echo.
echo [->] Opening browser in 4 seconds...
timeout /t 4 /nobreak >nul
start http://localhost:3000

echo.
echo ═══════════════════════════════════════════════════
echo    App open at: http://localhost:3000
echo ═══════════════════════════════════════════════════
echo.
echo    Close the Backend and Frontend windows to stop.
echo.
pause
