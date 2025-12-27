@echo off
echo ============================================
echo   AI Empires - BattleTech Launcher
echo   Single-player offline mode
echo ============================================
echo.
echo Credit: RogueTech by LadyAlekto and the RogueTech team
echo.

REM Start the AI service in the background
echo Starting AI Empires service...
start /b "" cscript //nologo "I:\roguetech-spt\AIEmpires\StartAIEmpires-Hidden.vbs"

REM Wait a moment for service to start
echo Waiting for AI service to initialize...
timeout /t 3 /nologo >nul

REM Check if service is running
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% == 0 (
    echo AI Service is running!
) else (
    echo WARNING: AI Service may not have started correctly.
    echo You can still play, but AI faction decisions won't work.
)

echo.
echo Launching BattleTech...
echo.

REM Launch the game
cd /d "F:\Program Files (x86)\Steam\steamapps\common\BATTLETECH"
start "" "BattleTech.exe"

echo.
echo Game launched!
echo.
echo This window will close in 5 seconds...
echo (AI service will continue running in background)
timeout /t 5 /nologo >nul
