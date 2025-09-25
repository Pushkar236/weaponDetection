# RTSP to HLS Conversion Server Setup

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **FFmpeg** (required for RTSP to HLS conversion)

## 🚀 Quick Setup

### Step 1: Install FFmpeg

**Windows:**

```powershell
# Using winget (Windows 10/11)
winget install ffmpeg

# OR using chocolatey
choco install ffmpeg

# OR download from httpss://ffmpeg.org/download.html
```

**Verify FFmpeg Installation:**

```powershell
ffmpeg -version
```

### Step 2: Install RTSP Server Dependencies

```powershell
cd rtsp-server
npm install
```

### Step 3: Start RTSP Server

```powershell
cd rtsp-server
npm start
```

You should see:

```
🚀 RTSP-HLS Server Started!
📡 Server: https://localhost:3001
📁 HLS Files: /path/to/hls
🔗 Health: https://localhost:3001/health
```

### Step 4: Start CCTV Dashboard

In a **new terminal**:

```powershell
cd ..  # Back to main project
npm run dev
```

## 🔧 Usage

1. **Start RTSP Server** (Terminal 1):

   ```powershell
   cd rtsp-server
   npm start
   ```

2. **Start Dashboard** (Terminal 2):

   ```powershell
   npm run dev
   ```

3. **Open Browser**: https://localhost:3000

## 📡 API Endpoints

- **Health Check**: `GET /health`
- **Start Stream**: `GET /api/start-stream/:streamId?rtspUrl=<url>`
- **Stop Stream**: `GET /api/stop-stream/:streamId`
- **Stream Status**: `GET /api/stream-status/:streamId`

## 🎯 Your RTSP Camera

**Camera URL**: `rtsp://admin:admin@192.168.137.40:1945`

The dashboard will automatically:

1. Connect to RTSP server
2. Start RTSP → HLS conversion
3. Display live video feed
4. Show connection status

## ⚠️ Troubleshooting

**"RTSP conversion server not running"**:

- Make sure `npm start` is running in `rtsp-server/` directory
- Check if port 3001 is available

**"Failed to start stream conversion"**:

- Verify your RTSP camera is accessible
- Check camera credentials (admin:admin)
- Ensure camera is on network (192.168.137.40:1935)

**FFmpeg errors**:

- Verify FFmpeg installation: `ffmpeg -version`
- Check camera stream format compatibility
- Try different RTSP transport options

## 🔄 Auto-Restart Script

Create `start.bat`:

```batch
@echo off
cd rtsp-server
start "RTSP Server" npm start
cd ..
timeout /t 5
start "Dashboard" npm run dev
pause
```

## 📊 Dashboard Features

- ✅ **Live RTSP Video** - Real-time camera feed
- ✅ **Connection Status** - Visual connection indicators
- ✅ **4 Camera Support** - Multiple RTSP streams
- ✅ **HLS Conversion** - Browser-compatible streaming
- ✅ **Auto-Reconnect** - Handles connection failures
