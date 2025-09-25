@echo off
echo 🚀 Setting up AI Weapon Detection Server (Lite Version)...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo ✅ Python found
echo.

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
    echo ✅ Virtual environment created
)

echo.

REM Activate virtual environment and install core dependencies
echo 📥 Installing core AI detection dependencies...
call venv\Scripts\activate.bat

REM Upgrade pip first
python -m pip install --upgrade pip --timeout 60

REM Install packages one by one to avoid timeouts
echo Installing torch...
pip install torch --timeout 300 --retries 3
if errorlevel 1 (
    echo ❌ Failed to install torch
    pause
    exit /b 1
)

echo Installing ultralytics...
pip install ultralytics --timeout 300 --retries 3
if errorlevel 1 (
    echo ❌ Failed to install ultralytics
    pause
    exit /b 1
)

echo Installing opencv-python...
pip install opencv-python --timeout 300 --retries 3

echo Installing other dependencies...
pip install pillow flask flask-cors pandas numpy pyyaml requests --timeout 300 --retries 3

echo ✅ Core dependencies installed successfully!
echo.
echo 🎯 Setup complete! 
echo.
echo To start the AI detection server:
echo 1. Run: start_server.bat
echo 2. Or manually: venv\Scripts\activate.bat && python detect_server.py
echo.
pause