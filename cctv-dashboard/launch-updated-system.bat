@echo off
title CCTV Weapon Detection Dashboard - Complete System Launcher
color 0A

echo.
echo ================================================================
echo 🛡️  CCTV Weapon Detection Dashboard - System Launcher
echo ================================================================
echo 🆕 Updated RTSP Configuration: rtsp://192.168.137.106:8554/stream
echo 📹 Cameras: 3x RTSP + 1x Local Webcam
echo ⚡ Enhanced WebRTC + RTSP-HLS Dual Streaming
echo ================================================================
echo.

echo 🔧 Killing any existing Node.js processes...
taskkill /F /IM node.exe 2>nul || echo    No Node processes to kill.

echo.
echo 🔍 Checking system requirements...

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js from httpss://nodejs.org
    pause
    exit /b 1
) else (
    echo ✅ Node.js found
)

:: Check FFmpeg
where ffmpeg >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  FFmpeg not found! Installing via winget...
    winget install ffmpeg -e
    if %errorlevel% neq 0 (
        echo ❌ Failed to install FFmpeg. Please install manually from httpss://ffmpeg.org
        pause
        exit /b 1
    )
) else (
    echo ✅ FFmpeg found
)

echo.
echo 🚀 Starting CCTV system servers...

:: Start WebRTC Server (Port 3003)
echo 🔷 Starting WebRTC Server (localhost:3003)...
start "WebRTC Server" cmd /k "cd webrtc-server && echo Starting WebRTC Server with enhanced RTSP handling... && npm start"
timeout /t 3 /nobreak >nul

:: Start RTSP-HLS Server (Port 3002)
echo 🔶 Starting RTSP-HLS Server (localhost:3002)...
start "RTSP Server" cmd /k "cd rtsp-server && echo Starting RTSP-HLS Conversion Server... && npm start"
timeout /t 3 /nobreak >nul

:: Start Next.js Dashboard (Port 3000)
echo 🔵 Starting Dashboard (localhost:3000)...
start "CCTV Dashboard" cmd /k "echo Starting CCTV Dashboard with updated camera configuration... && npm run dev"

echo.
echo ⏳ Waiting for servers to initialize...
timeout /t 8 /nobreak >nul

echo.
echo 🌐 Opening dashboard in browser...
start https://localhost:3000

echo.
echo ================================================================
echo ✅ CCTV SYSTEM STATUS - ALL SERVERS LAUNCHED!
echo ================================================================
echo 🔵 Main Dashboard     : https://localhost:3000
echo 🟠 WebRTC Dashboard   : https://localhost:3000/webrtc
echo 🔶 RTSP-HLS Server    : https://localhost:3002/health
echo 🔷 WebRTC Server      : https://localhost:3003 (Socket.IO)
echo.
echo 📹 CAMERA CONFIGURATION:
echo    • CAM-01: rtsp://192.168.137.106:8554/stream (New Server)
echo    • CAM-02: rtsp://192.168.137.106:8554/stream (New Server)
echo    • CAM-03: rtsp://192.168.137.106:8554/stream (New Server)
echo    • CAM-04: Local Webcam (System Camera)
echo.
echo 🎯 SYSTEM FEATURES:
echo    ✅ Real-time RTSP stream processing
echo    ✅ WebRTC dual streaming capability
echo    ✅ Local webcam integration
echo    ✅ Hydration-safe components
echo    ✅ Enhanced FFmpeg audio sync
echo    ✅ Professional weapon detection UI
echo    ✅ Toast notifications system
echo    ✅ Real-time detection panel
echo    ✅ System logs and monitoring
echo.
echo 🔧 TROUBLESHOOTING:
echo    • If cameras fail to connect, verify the RTSP server at 192.168.137.106:8554
echo    • Check camera permissions for local webcam access
echo    • Monitor server logs in the opened terminal windows
echo    • Use Ctrl+C in server terminals to stop individual services
echo.
echo 💡 QUICK ACTIONS:
echo    • Test your new RTSP URL: rtsp://192.168.137.106:8554/stream
echo    • Switch to WebRTC mode: https://localhost:3000/webrtc
echo    • View diagnostics: https://localhost:3000/test
echo.
echo Press any key to close this launcher (servers will continue running)...
echo ================================================================
pause >nul