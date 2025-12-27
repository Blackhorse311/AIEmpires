@echo off
echo ============================================
echo   AI Empires Mod Installer
echo ============================================
echo.

set BTMODS=F:\Program Files (x86)\Steam\steamapps\common\BATTLETECH\Mods
set SOURCE=I:\roguetech-spt\AIEmpires

echo Installing AIEmpires to Core folder...
if not exist "%BTMODS%\Core\AIEmpires" mkdir "%BTMODS%\Core\AIEmpires"
if not exist "%BTMODS%\Core\AIEmpires\config" mkdir "%BTMODS%\Core\AIEmpires\config"
if not exist "%BTMODS%\Core\AIEmpires\data" mkdir "%BTMODS%\Core\AIEmpires\data"

copy /Y "%SOURCE%\mod.json" "%BTMODS%\Core\AIEmpires\"
copy /Y "%SOURCE%\AIEmpires.dll" "%BTMODS%\Core\AIEmpires\"
copy /Y "%SOURCE%\config\*" "%BTMODS%\Core\AIEmpires\config\"

echo.
echo Installation complete!
echo.
echo IMPORTANT: Launch the game directly using BattleTech.exe
echo            Do NOT use the RogueTech Launcher (it will remove this mod)
echo.
echo Game location: %BTMODS%\..\BattleTech.exe
echo.
pause
