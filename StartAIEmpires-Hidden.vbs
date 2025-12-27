' AI Empires Service - Silent Launcher
' This script starts the AI service without a visible console window
' Double-click to run, or add to Windows Startup folder

Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "I:\roguetech-spt\AIEmpires\StartAIEmpires.bat" & Chr(34), 0
Set WshShell = Nothing
