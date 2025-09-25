@echo off
title CCTV WebRTC System Launcher
color 0A

echo ================================================================
echo 🚀 CCTV WEBRTC SYSTEM LAUNCHER
echo ================================================================
echo.

:: Kill any existing node processes
echo 🛑 Stopping existing Node.js processes...
taskkill /f /im node.exe 2>nul
echo ✅ Previous processes stopped
echo.

:: Check if Node.js is installed
echo 🔍 Checking system requirements...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)
echo ✅ Node.js found

:: Check if FFmpeg is installed
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔧 Installing FFmpeg...
    winget install Gyan.FFmpeg
    if %errorlevel% neq 0 (
        echo ❌ Failed to install FFmpeg
        pause
        exit /b 1
    )
)
echo ✅ FFmpeg found

:: Check and generate SSL certificates
if not exist localhost+2.pem (
    echo 🔐 Generating SSL certificates...
    where mkcert >nul 2>&1
    if %errorlevel% neq 0 (
        echo 🔧 Installing mkcert...
        winget install FiloSottile.mkcert
        if %errorlevel% neq 0 (
            echo ❌ Failed to install mkcert
            pause
            exit /b 1
        )
    )
    mkcert -install
    mkcert localhost 127.0.0.1 ::1
    echo ✅ SSL certificates generated
) else (
    echo ✅ SSL certificates found
)

echo.
echo 🚀 Starting WebRTC CCTV system...

:: Start WebRTC Server (Port 3003)
echo 🔷 Starting WebRTC Server (localhost:3003)...
start "WebRTC Server" cmd /k "cd webrtc-server && echo Starting WebRTC Server... && npm start"
timeout /t 4 /nobreak >nul

:: Start Next.js Dashboard with HTTPS (Port 3000)
echo 🔒 Starting HTTPS Dashboard (https://localhost:3000)...
start "CCTV HTTPS Dashboard" cmd /k "echo Starting CCTV Dashboard with HTTPS... && npm run dev:https"

echo.
echo ⏳ Waiting for servers to initialize...
timeout /t 8 /nobreak >nul

echo.
echo 🌐 Opening HTTPS dashboard in browser...
start https://localhost:3000

echo.
echo ================================================================
echo ✅ CCTV WEBRTC SYSTEM STATUS - ALL SERVERS LAUNCHED!
echo ================================================================
echo 🔒 Main Dashboard (HTTPS): https://localhost:3000
echo 🟠 WebRTC Dashboard      : https://localhost:3000/webrtc
echo 🔷 WebRTC Server         : https://localhost:3003 (Socket.IO)
echo.
echo 📹 CAMERA CONFIGURATION:
echo    • CAM-01: rtsp://192.168.137.106:8554/stream (WebRTC)
echo    • CAM-02: rtsp://192.168.137.106:8554/stream (WebRTC)
echo    • CAM-03: rtsp://192.168.137.106:8554/stream (WebRTC)
echo    • CAM-04: Local Webcam (System Camera) ✅ HTTPS ENABLED
echo.
echo 🎯 SYSTEM FEATURES:
echo    ✅ Real-time RTSP via WebRTC streaming
echo    ✅ Local webcam integration (HTTPS enabled)
echo    ✅ Hydration-safe components
echo    ✅ Enhanced FFmpeg processing
echo    ✅ Professional weapon detection UI
echo    ✅ Toast notifications system
echo    ✅ Real-time detection panel
echo    ✅ System logs and monitoring
echo    🔒 SSL certificates for camera access
echo.
echo 🔧 TROUBLESHOOTING:
echo    • Camera access works via HTTPS
echo    • If browser shows security warning, click "Advanced" then "Proceed"
echo    • Verify RTSP server at 192.168.137.106:8554
echo    • Monitor server logs in the opened terminal windows
echo    • Use Ctrl+C in server terminals to stop services
echo.
echo 💡 QUICK ACTIONS:
echo    • Test cameras: https://localhost:3000
echo    • WebRTC mode: https://localhost:3000/webrtc
echo    • Allow camera permissions when prompted
echo.
echo Press any key to close this launcher (servers will continue running)...
echo ================================================================
pause >nul