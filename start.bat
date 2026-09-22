@echo off
title Google Sheets Dashboard Server
cd /d "%~dp0"

echo ========================================================
echo   Google Sheets Dashboard - Local Server
echo ========================================================
echo.
echo Starting local web server and opening browser...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-server.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Notice] PowerShell script finished or was closed.
    echo Press any key to exit.
    pause >nul
)
