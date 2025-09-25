# 📱 **Wireless Camera Setup Guide**

## 🚀 **Easy Phone Camera Options (No RTSP needed!)**

### **Option 1: Direct Browser Access (Recommended)**

✅ **Your system is now configured for this!**

**How to use:**

1. Open `https://localhost:3000` on your computer
2. Open `https://192.168.137.155:3000` on your phone
3. Grant camera permissions when prompted
4. Each device will show its own camera feed

**Benefits:**

- ✅ No additional apps needed
- ✅ Works on any device with a browser
- ✅ Multiple cameras automatically detected
- ✅ Real-time streaming
- ✅ HTTPS secured

---

### **Option 2: IP Webcam App (Android)**

**Setup:**

1. Install "IP Webcam" from Play Store
2. Open app → Start Server
3. Note the IP address (e.g., `http://192.168.1.100:8080`)
4. Access via browser: `http://your-phone-ip:8080/video`

**Features:**

- 🎥 Full HD streaming
- 🔍 Zoom and focus controls
- 🌙 Night vision mode
- 🔊 Audio streaming

---

### **Option 3: DroidCam (Cross-platform)**

**Setup:**

1. Install DroidCam on phone and PC
2. Connect via WiFi or USB
3. Use as webcam in any application

**Benefits:**

- 📱 iOS and Android support
- 💻 Works with OBS, Zoom, etc.
- 🔄 Auto-reconnect feature

---

### **Option 4: Phone as WebRTC Camera**

**Modern Browser Method:**

1. Open dashboard on phone: `https://192.168.137.155:3000`
2. Grant camera permission
3. Leave phone positioned as security camera
4. Monitor from computer dashboard

---

## 🔧 **Technical Setup**

### **Network Requirements:**

- All devices on same WiFi network
- HTTPS enabled (already configured)
- Modern browser support (Chrome, Firefox, Safari)

### **Camera Permissions:**

- Allow camera access when prompted
- For phone: Settings → Site Settings → Camera → Allow

### **Multiple Device Setup:**

1. **Computer:** Main monitoring dashboard
2. **Phone 1:** Position as Camera 1, open dashboard
3. **Phone 2:** Position as Camera 2, open dashboard
4. **Tablet:** Position as Camera 3, open dashboard

---

## 🌐 **Access URLs**

**Main Dashboard:** `https://localhost:3000`
**Network Access:** `https://192.168.137.155:3000`
**Mobile Access:** `https://[your-computer-ip]:3000`

---

## 🎯 **Advantages Over RTSP**

| Feature          | WebRTC/Browser  | RTSP                 |
| ---------------- | --------------- | -------------------- |
| Setup            | ✅ Instant      | ❌ Complex           |
| Phone Support    | ✅ Native       | ❌ Needs apps        |
| Latency          | ✅ Ultra-low    | ❌ Higher            |
| Security         | ✅ HTTPS        | ❌ Unencrypted       |
| Multiple Cameras | ✅ Auto-detect  | ❌ Manual config     |
| No Installation  | ✅ Browser only | ❌ Requires software |

---

## 🚀 **Quick Start Command**

```bash
# Start the system
npm run dev:https

# Then open on any device:
# Computer: https://localhost:3000
# Phone: https://192.168.137.155:3000
```

**That's it! No RTSP servers, no complex setup needed!** 🎉
