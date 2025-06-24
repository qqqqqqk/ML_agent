@echo off
echo ========================================
echo ML Code Generator v2 - Quick Start
echo ========================================
echo.

echo Step 1: Cleaning up existing processes...
tasklist | findstr node.exe > nul
if %errorlevel% equ 0 (
    echo Found Node.js processes, terminating them...
    taskkill /F /IM node.exe > nul 2>&1
    echo Cleanup complete!
    timeout /t 2 /nobreak > nul
) else (
    echo No existing processes found
)
echo.

echo Step 2: Starting servers...
echo Starting backend server...
cd /d "%~dp0\server"
start "Backend Server" cmd /k "npm start"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting frontend server...
cd /d "%~dp0"
start "Frontend Server" cmd /k "npm start"

echo Waiting for frontend to start...
timeout /t 3 /nobreak > nul

echo.
echo Step 3: Opening browser...
start http://localhost:3000

echo.
echo ========================================
echo Servers are starting up!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo To stop all servers, run: cleanup.bat
echo.
pause 