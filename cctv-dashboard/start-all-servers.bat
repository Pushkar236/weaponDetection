@echo off@echo off

echo Starting CCTV Dashboard System...title CCTV WebRTC Dashboard

color 0A

echo.echo.

echo =========================echo 🚀 CCTV Weapon Detection Dashboard

echo Starting RTSP-HLS Serverecho 📡 Starting WebRTC + Dashboard...

echo =========================echo.

start "RTSP-HLS Server" powershell -Command "cd 'rtsp-server'; npm start"

REM Check if Node.js is installed

echo.node --version >nul 2>&1

echo =========================if %errorlevel% neq 0 (

echo Starting WebRTC Server      echo ❌ Error: Node.js is not installed!

echo =========================    echo Please install Node.js from: httpss://nodejs.org/

start "WebRTC Server" powershell -Command "cd 'webrtc-server'; npm start"    pause

    exit /b 1

echo.)

echo Waiting for servers to initialize...

timeout /t 3 /nobreak > nulecho ✅ Node.js detected



echo.REM Install dependencies

echo =========================if not exist "node_modules" (

echo Starting Next.js Dashboard    echo 📦 Installing main dependencies...

echo =========================    npm install

echo Dashboard will be available at: httpss://localhost:3000)

npm run dev:httpss

if not exist "webrtc-server\node_modules" (

pause    echo 📦 Installing WebRTC server dependencies...
    cd webrtc-server
    npm install
    cd ..
)

echo.
echo [1/2] Starting WebRTC Server on port 3003...
cd webrtc-server
start "WebRTC Server" /min cmd /k "npm start"
cd ..

REM Wait for server to start
echo [2/2] Starting Dashboard on port 3000...
timeout /t 3 /nobreak >nul

REM Start Dashboard
start "CCTV Dashboard" cmd /k "npm run dev"

REM Wait and open browser
timeout /t 5 /nobreak >nul

echo.
echo 🌐 Opening WebRTC dashboard...
start https://localhost:3000/webrtc

echo.
echo ✅ All servers started successfully!
echo.
echo ⚡ WebRTC Dashboard: https://localhost:3000/webrtc  
echo  WebRTC Server: https://localhost:3003
echo.
echo Press any key to close this launcher...
pause >nul