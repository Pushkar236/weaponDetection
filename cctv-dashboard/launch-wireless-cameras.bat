@echo off
title Wireless Camera System
color 0A

echo ================================================================
echo 📱 WIRELESS CAMERA SYSTEM LAUNCHER
echo ================================================================
echo.

:: Stop existing processes
taskkill /f /im node.exe 2>nul
echo ✅ Previous processes stopped

:: Start the dashboard
echo 🚀 Starting Wireless Camera Dashboard...
echo.
start "Wireless Camera Dashboard" cmd /k "npm run dev:https"
timeout /t 5 /nobreak >nul

:: Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "ip=%%a"
    goto :found
)
:found
set ip=%ip:~1%

echo.
echo ================================================================
echo ✅ WIRELESS CAMERA SYSTEM ACTIVE!
echo ================================================================
echo.
echo 🖥️  COMPUTER ACCESS:
echo     https://localhost:3000
echo.
echo 📱 PHONE/TABLET ACCESS:
echo     https://%ip%:3000
echo.
echo 📲 IP WEBCAM INTEGRATION:
echo     Camera 1: https://192.168.137.40:8080/video (Already configured!)
echo     Your IP Webcam app is streaming to CAM-01
echo.
echo 🎯 HOW TO USE:
echo   1. Your IP Webcam (192.168.137.40:8080) shows as CAM-01
echo   2. Open the URL above on other devices for CAM-02 and CAM-03
echo   3. Grant camera permission when prompted
echo   4. Position devices as security cameras
echo.
echo 📋 SUPPORTED DEVICES:
echo   ✅ IP Webcam App (Android) - CAM-01 configured!
echo   ✅ Android phones/tablets - for CAM-02 and CAM-03
echo   ✅ iPhone/iPad - for CAM-02 and CAM-03
echo   ✅ Laptops with webcams
echo   ✅ Desktop computers with cameras
echo.
echo 🔒 FEATURES:
echo   ✅ HTTPS secured connections
echo   ✅ Real-time video streaming
echo   ✅ Multiple camera detection
echo   ✅ No additional apps needed
echo   ✅ Professional weapon detection UI
echo.
echo 💡 TIPS:
echo   • Use phone stands for stable positioning
echo   • Ensure good WiFi connection
echo   • Keep devices charged/plugged in
echo   • Allow camera permissions for best experience
echo.
echo 🌐 Opening dashboard in browser...
timeout /t 2 /nobreak >nul
start https://localhost:3000

echo.
echo Press any key to close this launcher (system will continue running)...
echo ================================================================
pause >nul