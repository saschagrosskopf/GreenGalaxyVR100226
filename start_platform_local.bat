@echo off
setlocal enabledelayedexpansion

echo 🚀 GreenGalaxy Platform - Local Launcher (No Docker)
echo ═══════════════════════════════════════════════════

cd /d "%~dp0"

echo 1. Launching Backend (FastAPI)...
cd backend
:: Install requirements if needed
echo [Backend] Checking dependencies...
python -m pip install -r requirements.txt || echo [Backend] Pip failed, skipping install.
start "GG_BACKEND" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
cd ..

timeout /t 2 /nobreak >nul

echo 2. Launching Multiplayer (Colyseus)...
cd MVP/server
echo [Multiplayer] Checking dependencies...
cmd /c npm install || echo [Multiplayer] Npm failed, skipping install.
start "GG_MULTIPLAYER" cmd /k "npm run dev"
cd ../..

timeout /t 2 /nobreak >nul

echo 3. Launching Frontend (Vite)...
cd frontend
echo [Frontend] Checking dependencies...
cmd /c npm install || echo [Frontend] Npm failed, skipping install.
start "GG_FRONTEND" cmd /k "npm run dev"
cd ..

echo ═══════════════════════════════════════════════════
echo ✅ ALL SERVICES STARTING
echo - Frontend: http://localhost:5173 (standard Vite port)
echo - Backend API: http://localhost:8000
echo - Multiplayer: ws://localhost:2567
echo ═══════════════════════════════════════════════════
echo Keeping this window open to monitor launch...
pause
