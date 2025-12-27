@echo off
title AI Empires Service
color 0A

echo ========================================
echo       AI Empires Service Launcher
echo ========================================
echo.

REM Change to the ai_service directory
cd /d "I:\roguetech-spt\AIEmpires\src\ai_service"

REM Check if .env exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo Please copy .env.example to .env and add your ANTHROPIC_API_KEY
    pause
    exit /b 1
)

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found in PATH!
    echo Please install Python 3.10+ and add it to your PATH
    pause
    exit /b 1
)

echo [OK] Python found
echo [OK] Configuration found
echo.
echo Starting AI Empires Service...
echo Service will be available at: http://127.0.0.1:5000
echo.
echo Press Ctrl+C to stop the service
echo ========================================
echo.

REM Start the service
python main.py

pause
