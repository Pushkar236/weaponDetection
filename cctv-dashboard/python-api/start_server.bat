@echo off
echo 🤖 Starting AI Weapon Detection Server...
echo.
echo 📍 Server will be available at: http://localhost:5000
echo 🔄 Loading your trained models (best.pt & last.pt)...
echo.

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Start the detection server
python detect_server.py

echo.
echo 🛑 Server stopped
pause