@echo off
title Local RTSP Server
color 0A

echo ================================================================
echo 📡 STARTING LOCAL RTSP SERVER
echo ================================================================
echo.

:: Create a test video file if it doesn't exist
if not exist "test-video.mp4" (
    echo 🎬 Creating test video...
    ffmpeg -f lavfi -i testsrc2=duration=30:size=640x480:rate=30 -f lavfi -i sine=frequency=1000:duration=30 -c:v libx264 -c:a aac -shortest test-video.mp4
    echo ✅ Test video created
)

echo 🔄 Starting RTSP server on rtsp://192.168.137.155:8554/stream
echo 📺 Broadcasting test video in loop...
echo.
echo 🛑 Press Ctrl+C to stop the server
echo.

:: Start RTSP server
ffmpeg -re -stream_loop -1 -i test-video.mp4 -c copy -f rtsp -rtsp_transport tcp rtsp://192.168.137.155:8554/stream

pause