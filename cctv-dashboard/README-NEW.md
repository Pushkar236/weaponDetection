# 🛡️ CCTV Weapon Detection Dashboard

A real-time CCTV surveillance system with weapon detection capabilities and RTSP camera integration.

## 🎯 Features

- ✅ **Live RTSP Camera Feeds** - Real-time video streaming from IP cameras
- ✅ **RTSP to HLS Conversion** - Browser-compatible streaming via FFmpeg
- ✅ **Weapon Detection Simulation** - AI-powered threat detection alerts
- ✅ **Multi-Camera Support** - 4-camera grid layout
- ✅ **Real-time Alerts** - Toast notifications and audio alerts
- ✅ **Detection Logs** - Complete audit trail with screenshots
- ✅ **Professional UI** - Military-grade green terminal aesthetic

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **FFmpeg** (for RTSP conversion)

### Option 1: Auto-Start (Windows)

```batch
# Double-click to start both servers
start-servers.bat
```

### Option 2: Manual Start

**Terminal 1 - RTSP Server:**

```powershell
cd rtsp-server
npm install
npm start
```

**Terminal 2 - Dashboard:**

```powershell
npm install
npm run dev
```

**Open Dashboard:** https://localhost:3000

## 📡 RTSP Camera Setup

Your camera: `rtsp://admin:admin@192.168.137.40:1945`

### Install FFmpeg (Windows)

```powershell
# Using winget
winget install ffmpeg

# Using chocolatey
choco install ffmpeg

# Verify installation
ffmpeg -version
```

### How It Works

1. **RTSP Server** (Port 3001) converts RTSP → HLS
2. **Dashboard** (Port 3000) displays converted video feeds
3. **FFmpeg** handles real-time stream conversion
4. **Browser** plays HLS streams natively

## 🛠️ Complete Setup Guide

### 1. Install Dependencies

```powershell
# Main dashboard
npm install

# RTSP server
cd rtsp-server
npm install
```

### 2. Start Services

```powershell
# Terminal 1: RTSP Server
cd rtsp-server
node server.js

# Terminal 2: Dashboard
npm run dev
```

### 3. Test Connection

- **Dashboard**: https://localhost:3000
- **RTSP Server**: https://localhost:3001/health
- **Your Camera**: Will auto-connect and show live video

## 🎥 Dashboard Features

### Camera Grid

- **CAM-01**: Your RTSP camera (192.168.137.40:1935)
- **CAM-02-04**: Additional RTSP endpoints
- **Live Status**: Real-time connection indicators
- **HLS Conversion**: Automatic RTSP → browser compatibility

### Detection System

- **Weapon Detection**: AI-powered threat analysis
- **Real-time Alerts**: Instant notifications with audio
- **Evidence Capture**: Automatic screenshots
- **Audit Trail**: Complete detection history

## ⚠️ Troubleshooting

### "RTSP conversion server not running"

```powershell
cd rtsp-server
node server.js
```

### "Failed to start stream conversion"

- Check camera: `ping 192.168.137.40`
- Verify RTSP URL and credentials
- Test with VLC player first

### "FFmpeg not found"

```powershell
winget install ffmpeg
ffmpeg -version  # Should show version info
```

## 📁 Project Structure

```
cctv-dashboard/
├── components/
│   ├── RTSPTest.tsx     # RTSP camera component
│   ├── LogsPanel.tsx    # Detection logs
│   └── Toast.tsx        # Alert notifications
├── rtsp-server/         # RTSP-HLS server
│   ├── server.js        # Express server + FFmpeg
│   └── hls/            # Generated video files
├── src/app/            # Next.js dashboard
└── start-servers.bat   # Easy launcher
```

## 🔧 API Endpoints

**RTSP Server (Port 3001):**

```
GET /health                          - Server status
GET /api/start-stream/:id?rtspUrl=*  - Start conversion
GET /api/stream-status/:id           - Stream status
GET /hls/:id.m3u8                   - HLS playlist
```

## 🎛️ Configuration

### Add More Cameras

Edit `src/app/page.tsx`:

```typescript
// Add your camera URLs
<RTSPTest
  rtspUrl="rtsp://admin:admin@192.168.137.40:1945"
  cameraName="Your Camera"
/>
```

### Change Ports

- **Dashboard**: Edit `package.json` scripts
- **RTSP Server**: Edit `rtsp-server/server.js` PORT

## 🚀 **Ready to Use!**

### Quick Test

1. **Double-click** `start-servers.bat`
2. **Wait 10 seconds** for FFmpeg conversion
3. **Open** https://localhost:3000
4. **See your camera** live in the browser!

### Your RTSP Stream

**URL**: `rtsp://admin:admin@192.168.137.40:1945`  
**Status**: Auto-connecting when dashboard loads  
**Format**: Converted to HLS for browser compatibility

---

## 📄 License

MIT License - Feel free to use and modify for your security needs.

**Built for real-time security monitoring** 🛡️
