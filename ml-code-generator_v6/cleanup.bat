@echo off
echo Cleaning up Node.js processes...
echo.

echo Checking for existing Node.js processes...
tasklist | findstr node.exe > nul
if %errorlevel% equ 0 (
    echo Found Node.js processes:
    tasklist | findstr node.exe
    echo.
    echo Terminating all Node.js processes...
    taskkill /F /IM node.exe
    if %errorlevel% equ 0 (
        echo Successfully terminated all Node.js processes
    ) else (
        echo Warning: Could not terminate some processes (may need admin rights)
        echo Try running this script as administrator
    )
) else (
    echo No Node.js processes found
)

echo.
echo Checking for processes on ports 3000 and 5000...
netstat -ano | findstr :3000
netstat -ano | findstr :5000

echo.
echo Cleanup complete!
pause 