@echo off
title CCTV httpsS Dashboard - Complete System Launcher
color 0A

echo.
echo ================================================================
echo 🛡️  CCTV Weapon Detection Dashboard - httpsS System Launcher
echo ================================================================
echo 🔒 httpsS Enabled: Camera access available
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

:: Check SSL certificates
if not exist "localhost+2.pem" (
    echo ⚠️  SSL certificates not found! Generating...
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
echo 🚀 Starting CCTV system servers...

:: Start WebRTC Server (Port 3003)
echo 🔷 Starting WebRTC Server (localhost:3003)...
start "WebRTC Server" cmd /k "cd webrtc-server && echo Starting WebRTC Server with enhanced RTSP handling... && npm start"
timeout /t 3 /nobreak >nul

:: Start RTSP-HLS Server (Port 3002)
echo 🔶 Starting RTSP-HLS Server (localhost:3002)...
start "RTSP Server" cmd /k "cd rtsp-server && echo Starting RTSP-HLS Conversion Server... && npm start"
timeout /t 3 /nobreak >nul

:: Start Next.js Dashboard with HTTPS (Port 3000)
echo 🔒 Starting HTTPS Dashboard (https://localhost:3000)...
start "CCTV HTTPS Dashboard" cmd /k "echo Starting CCTV Dashboard with HTTPS for camera access... && npm run dev:https"

echo.
echo ⏳ Waiting for servers to initialize...
timeout /t 8 /nobreak >nul

echo.
echo 🌐 Opening HTTPS dashboard in browser...
start https://localhost:3000

echo.
echo ================================================================
echo ✅ CCTV SYSTEM STATUS - ALL SERVERS LAUNCHED WITH HTTPS!
echo ================================================================
echo 🔒 Main Dashboard (HTTPS): https://localhost:3000
echo 🟠 WebRTC Dashboard      : https://localhost:3000/webrtc
echo 🔶 RTSP-HLS Server       : https://localhost:3002/health
echo 🔷 WebRTC Server         : https://localhost:3003 (Socket.IO)
echo.
echo 📹 CAMERA CONFIGURATION:
echo    • CAM-01: rtsp://192.168.137.106:8554/stream (New Server)
echo    • CAM-02: rtsp://192.168.137.106:8554/stream (New Server)
echo    • CAM-03: rtsp://192.168.137.106:8554/stream (New Server)
echo    • CAM-04: Local Webcam (System Camera) ✅ HTTPS ENABLED
echo.
echo 🎯 SYSTEM FEATURES:
echo    ✅ Real-time RTSP stream processing
echo    ✅ WebRTC dual streaming capability
echo    ✅ Local webcam integration (HTTPS enabled)
echo    ✅ Hydration-safe components
echo    ✅ Enhanced FFmpeg audio sync
echo    ✅ Professional weapon detection UI
echo    ✅ Toast notifications system
echo    ✅ Real-time detection panel
echo    ✅ System logs and monitoring
echo    🔒 SSL certificates for camera access
echo.
echo 🔧 TROUBLESHOOTING:
echo    • Camera access now works via HTTPS
echo    • If browser shows security warning, click "Advanced" then "Proceed"
echo    • Verify RTSP server at 192.168.137.106:8554
echo    • Monitor server logs in the opened terminal windows
echo    • Use Ctrl+C in server terminals to stop individual services
echo.
echo 💡 QUICK ACTIONS:
echo    • Test cameras: https://localhost:3000
echo    • WebRTC mode: https://localhost:3000/webrtc
echo    • Diagnostics: https://localhost:3000/test
echo    • Allow camera permissions when prompted
echo.
echo Press any key to close this launcher (servers will continue running)...
echo ================================================================
pause >nul