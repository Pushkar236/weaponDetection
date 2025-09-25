# WebRTC Audio Timestamp Fix - Technical Summary

## 🎵 **Audio Sync Issues Resolved**

### **Problem Identified:**

The FFmpeg logs showed **"Non-monotonic DTS"** warnings and **"Queue input is backward in time"** errors. These occur when:

- RTSP stream has inconsistent audio timestamps
- Audio packets arrive out of order
- Source camera has audio sync issues

### **Solution Implemented:**

#### **1. Enhanced FFmpeg Input Options:**

```javascript
.inputOptions([
  '-rtsp_transport', 'tcp',
  '-timeout', '5000000',
  '-fflags', '+genpts+discardcorrupt',  // Generate PTS + discard corrupt frames
  '-avoid_negative_ts', 'make_zero',    // Fix negative timestamps
  '-max_delay', '500000'                // Max delay for packet buffering
])
```

#### **2. Audio Synchronization Output Options:**

```javascript
.outputOptions([
  // ... existing video options ...
  '-c:a', 'aac',
  '-b:a', '128k',
  '-ar', '44100',
  '-ac', '2',
  '-async', '1',                                    // Audio sync method
  '-vsync', 'cfr',                                  // Constant frame rate
  '-af', 'aresample=async=1:min_hard_comp=0.100000:first_pts=0'  // Audio resampling
])
```

### **Key Improvements:**

1. **Timestamp Correction:**

   - `+genpts`: Regenerates presentation timestamps
   - `avoid_negative_ts make_zero`: Eliminates negative timestamps
   - `discardcorrupt`: Drops corrupted frames

2. **Audio Sync:**

   - `async 1`: Enables audio synchronization
   - `aresample`: Resamples audio to fix timing
   - `first_pts=0`: Sets first presentation timestamp to zero

3. **Stream Reliability:**
   - `max_delay 500000`: Buffers packets for better ordering
   - `vsync cfr`: Maintains constant frame rate

### **Expected Results:**

- ✅ Reduced "Non-monotonic DTS" warnings
- ✅ Smoother audio/video synchronization
- ✅ More stable WebRTC streaming
- ✅ Better browser compatibility

### **Testing Status:**

- **WebRTC Server**: ✅ Updated with new FFmpeg parameters
- **CSP Policies**: ✅ Configured for localhost:3003
- **Dashboard**: ✅ Ready for testing at https://localhost:3000/webrtc

### **Monitor for Improvements:**

Watch for reduced error messages in FFmpeg output:

- Fewer "Non-monotonic DTS" warnings
- Reduced "Queue input is backward in time" errors
- Smoother frame rate progression
- More consistent bitrate

---

**Note:** These are advanced FFmpeg optimizations specifically for RTSP-to-WebRTC conversion with problematic audio streams from security cameras.
