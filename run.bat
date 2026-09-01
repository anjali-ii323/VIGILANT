@echo off
title VIGILANT - Proactive Financial Cybercrime Intelligence
color 0A

echo =========================================================================
echo  VIGILANT - Proactive Financial Cybercrime Intelligence Platform
echo  SIH Problem Statement 26184
echo =========================================================================
echo.
echo [1/3] Checking environment & database...
cd backend
if not exist "fintrace.db" (
    echo Seeding synthetic investigation database...
    ..\venv\Scripts\python.exe -m app.seed
)

echo.
echo [2/3] Starting Unified VIGILANT Platform (Frontend + Backend + ML API)...
echo.
echo -------------------------------------------------------------------------
echo  Access the full application at: http://localhost:8000
echo  (Zero API keys required - 100%% self-contained offline & synthetic)
echo -------------------------------------------------------------------------
echo.

..\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
