@echo off
echo Starting ML Code Generator v2...
echo.

echo Cleaning up existing Node.js processes...
tasklist | findstr node.exe > nul
if %errorlevel% equ 0 (
    echo Found existing Node.js processes, terminating them...
    taskkill /F /IM node.exe > nul 2>&1
    if %errorlevel% equ 0 (
        echo Successfully terminated Node.js processes
    ) else (
        echo Warning: Could not terminate some Node.js processes (may need admin rights)
        echo You may need to manually close them or run as administrator
    )
    timeout /t 2 /nobreak > nul
) else (
    echo No existing Node.js processes found
)
echo.

echo Installing dependencies...
echo.

echo Installing frontend dependencies...
cd /d "%~dp0"
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies
    pause
    exit /b 1
)

echo.
echo Installing backend dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies
    pause
    exit /b 1
)

echo.
echo Installing Python dependencies...
call pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Warning: Some Python dependencies may not be installed correctly
    echo Please check your Python environment
)

echo.
echo Starting backend server...
start "Backend Server" cmd /k "npm start"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting frontend server...
start "Frontend Server" cmd /k "cd /d "%~dp0" && npm start"

echo.
echo Opening browser...
timeout /t 3 /nobreak > nul
start http://localhost:3000

echo.
echo ML Code Generator v2 is starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this launcher...
pause > nul 