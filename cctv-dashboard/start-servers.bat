@echo off
title CCTV RTSP Dashboard Launcher
echo.
echo 🚀 CCTV Weapon Detection Dashboard
echo 📡 Starting RTSP-HLS Server and Dashboard...
echo.

REM Start RTSP Server
echo [1/2] Starting RTSP-HLS Server on port 3002...
cd rtsp-server
start "RTSP-HLS Server" /min cmd /k "node server.js"
cd ..

REM Wait a moment for server to start
echo [2/2] Starting Dashboard on port 3000...
timeout /t 3 /nobreak >nul

REM Start Dashboard
start "CCTV Dashboard" cmd /k "npm run dev"

REM Open browser
timeout /t 5 /nobreak >nul
start https://localhost:3000

echo.
echo ✅ Both servers started successfully!
echo.
echo 🌐 CCTV Dashboard: https://localhost:3000
echo 📡 RTSP Server: https://localhost:3002
echo 🔧 Health Check: https://localhost:3002/health
echo.
echo 💡 Your RTSP camera: rtsp://admin:admin@192.168.137.40:1945
echo    The dashboard will automatically convert RTSP to HLS for browser playback.
echo.
echo Press any key to close this launcher...
pause >nul