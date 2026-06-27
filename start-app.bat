@echo off
setlocal

cd /d "%~dp0"

if not exist node_modules (
  echo Installing dependencies...
  call npm.cmd install
  if errorlevel 1 exit /b 1
)

echo Starting The Open Syllabus...
start "The Open Syllabus Server" cmd /k "cd /d ""%~dp0"" && npm.cmd run dev"

timeout /t 4 /nobreak >nul
start "" "http://localhost:3000"
