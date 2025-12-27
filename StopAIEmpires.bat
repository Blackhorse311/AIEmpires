@echo off
echo Stopping AI Empires Service...

REM Find and kill Python processes running main.py
taskkill /F /IM python.exe /FI "WINDOWTITLE eq AI Empires Service" >nul 2>&1

REM Also try to kill by port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Service stopped.
timeout /t 2
