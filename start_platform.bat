@echo off
setlocal enabledelayedexpansion

echo 🚀 GreenGalaxy Platform - Master Controller
echo ══════════════════════════════════════════

:: Move to the directory where the script is located
cd /d "%~dp0"

echo 1. Building Frontend...
if exist "frontend" (
    cd frontend
    :: Use 'cmd /c' to avoid terminating the batch script
    cmd /c npm run build
    if !errorlevel! neq 0 (
        echo ❌ Frontend build failed!
        pause
        exit /b !errorlevel!
    )
    cd ..
) else (
    echo ❌ Folder 'frontend' not found!
    pause
    exit /b 1
)

echo.
echo 2. Launching Orchestration (Docker Compose)...

:: Check for 'docker compose' (V2) or 'docker-compose' (V1)
docker compose version >nul 2>&1
if !errorlevel! equ 0 (
    docker compose up -d --build
) else (
    docker-compose version >nul 2>&1
    if !errorlevel! equ 0 (
        docker-compose up -d --build
    ) else (
        echo ❌ Docker Compose not found! Please ensure Docker Desktop is running.
        pause
        exit /b 1
    )
)

echo ══════════════════════════════════════════
echo ✅ PLATFORM ONLINE
echo - Frontend: http://localhost
echo - Backend:  http://localhost:8080
echo - Multiplayer: ws://localhost:2567
echo ══════════════════════════════════════════
pause
