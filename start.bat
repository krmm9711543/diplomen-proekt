@echo off
title Smart Home System
echo Starting the Smart Home System...
echo =================================

cd /d "%~dp0"

IF NOT EXIST "node_modules\concurrently" (
    echo [1/3] Installing main dependencies...
    cmd /c "npm install"
)

IF NOT EXIST "frontend\node_modules\vite" (
    echo [2/3] Installing frontend dependencies...
    cmd /c "cd frontend && npm install"
)

IF NOT EXIST "backend\node_modules\express" (
    echo [3/3] Installing backend dependencies...
    cmd /c "cd backend && npm install"
)

echo.
echo Ready! Starting backend and frontend...
echo Keep this window open. The website should be at http://localhost:5173
echo.
npm run dev
pause
