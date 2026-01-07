@echo off
echo ========================================
echo Starting RakshaDrishti Backend Server
echo ========================================
echo.

cd backend

echo Checking for processes on port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Killing process %%a on port 3001...
    taskkill /F /PID %%a 2>nul
)

echo.
echo Starting backend server...
echo.

npm start

pause

