const express = require('express');
const https = require('https');
const socketIo = require('socket.io');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();

// SSL certificate configuration
let server;
try {
  const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, '..', 'localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '..', 'localhost+2.pem'))
  };
  server = https.createServer(sslOptions, app);
  console.log('✅ SSL certificates loaded for WebRTC server');
} catch (error) {
  console.log('⚠️  SSL certificates not found, falling back to HTTP');
  server = require('http').createServer(app);
}
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3003;

// Try to set FFmpeg path - common Windows locations
const ffmpegPaths = [
  'C:\\ffmpeg\\bin\\ffmpeg.exe',
  'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
  'C:\\Users\\' + require('os').userInfo().username + '\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.0-full_build\\bin\\ffmpeg.exe',
  'ffmpeg' // Default PATH
];

let ffmpegPath = 'ffmpeg';
for (const testPath of ffmpegPaths) {
  try {
    if (fs.existsSync(testPath)) {
      ffmpegPath = testPath;
      console.log(`✅ Found FFmpeg at: ${ffmpegPath}`);
      break;
    }
  } catch (e) {
    continue;
  }
}

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Enable CORS
app.use(cors());
app.use(express.json());

// Store active WebRTC streams
const activeStreams = new Map();
const clients = new Map();

// WebRTC Signaling Server
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  clients.set(socket.id, socket);

  // Handle offer from client (WebRTC peer connection)
  socket.on('offer', async (data) => {
    console.log(`📝 Received offer from ${socket.id}`);
    
    try {
      // Start FFmpeg process to convert RTSP to WebRTC-compatible format
      if (data.rtspUrl) {
        await startWebRTCStream(socket.id, data.rtspUrl, socket);
      }
      
      // Echo the offer back (in a real implementation, you'd handle SDP negotiation)
      socket.emit('answer', {
        type: 'answer',
        sdp: data.sdp // This is simplified - real WebRTC needs proper SDP handling
      });
    } catch (error) {
      console.error('❌ Error handling offer:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (candidate) => {
    console.log(`🧊 ICE candidate from ${socket.id}`);
    // In a real implementation, relay ICE candidates between peers
    socket.emit('ice-candidate', candidate);
  });

  // Handle stream start request
  socket.on('start-stream', async (data) => {
    console.log(`🎬 Starting WebRTC stream for ${socket.id}:`, data.rtspUrl);
    
    try {
      await startWebRTCStream(socket.id, data.rtspUrl, socket);
      socket.emit('stream-started', { success: true, streamId: socket.id });
    } catch (error) {
      console.error('❌ Error starting WebRTC stream:', error);
      socket.emit('stream-error', { error: error.message });
    }
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    stopWebRTCStream(socket.id);
    clients.delete(socket.id);
  });
});

// Start WebRTC stream with FFmpeg
async function startWebRTCStream(streamId, rtspUrl, socket) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Starting WebRTC conversion: ${rtspUrl}`);
    
    // Stop existing stream if any
    stopWebRTCStream(streamId);

    // FFmpeg command to convert RTSP to WebRTC-compatible format
    // Output as fragmented MP4 over https for better browser compatibility
    const outputPath = path.join(__dirname, 'webrtc', `${streamId}.mp4`);
    
    // Ensure webrtc directory exists
    const webrtcDir = path.join(__dirname, 'webrtc');
    if (!fs.existsSync(webrtcDir)) {
      fs.mkdirSync(webrtcDir, { recursive: true });
    }

    const command = ffmpeg(rtspUrl)
      .inputOptions([
        '-rtsp_transport', 'tcp',
        '-timeout', '5000000',
        '-fflags', '+genpts+discardcorrupt',
        '-avoid_negative_ts', 'make_zero',
        '-max_delay', '500000'
      ])
      .outputOptions([
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov+faststart',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'zerolatency',
        '-profile:v', 'baseline',
        '-level', '3.0',
        '-pix_fmt', 'yuv420p',
        '-r', '30',
        '-g', '60',
        '-keyint_min', '60',
        '-sc_threshold', '0',
        '-b:v', '1000k',
        '-maxrate', '1200k',
        '-bufsize', '2000k',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '44100',
        '-ac', '2',
        '-async', '1',
        '-vsync', 'cfr',
        '-af', 'aresample=async=1:min_hard_comp=0.100000:first_pts=0'
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('✅ FFmpeg WebRTC process started:', commandLine);
        resolve(command);
      })
      .on('progress', (progress) => {
        if (progress.frames && progress.frames % 30 === 0) {
          console.log(`📊 WebRTC: ${progress.frames} frames, ${progress.currentFps || 0} fps`);
          
          // Send progress updates to client
          socket.emit('stream-progress', {
            frames: progress.frames,
            fps: progress.currentFps || 0,
            bitrate: progress.currentKbps || 0
          });
        }
      })
      .on('error', (err, stdout, stderr) => {
        console.error('❌ FFmpeg WebRTC error:', err.message);
        console.error('FFmpeg stderr:', stderr);
        activeStreams.delete(streamId);
        socket.emit('stream-error', { error: err.message, stderr });
        reject(err);
      })
      .on('end', () => {
        console.log('🏁 FFmpeg WebRTC process ended');
        activeStreams.delete(streamId);
        socket.emit('stream-ended');
      });

    // Store the command for later cleanup
    activeStreams.set(streamId, command);
    
    // Start the conversion
    command.run();
  });
}

// Stop WebRTC stream
function stopWebRTCStream(streamId) {
  const command = activeStreams.get(streamId);
  if (command) {
    console.log(`🛑 Stopping WebRTC stream: ${streamId}`);
    command.kill('SIGKILL');
    activeStreams.delete(streamId);
    
    // Clean up output file
    const outputPath = path.join(__dirname, 'webrtc', `${streamId}.mp4`);
    if (fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
      } catch (e) {
        console.warn('⚠️ Could not delete WebRTC file:', e.message);
      }
    }
  }
}

// Serve WebRTC files
app.use('/webrtc', express.static(path.join(__dirname, 'webrtc')));

// REST API endpoints
app.get('/api/webrtc/start/:streamId', async (req, res) => {
  const { streamId } = req.params;
  const { rtspUrl } = req.query;
  
  if (!rtspUrl) {
    return res.status(400).json({ error: 'RTSP URL is required' });
  }

  try {
    const socket = clients.get(streamId) || null;
    if (!socket) {
      return res.status(400).json({ error: 'WebSocket connection required' });
    }

    await startWebRTCStream(streamId, rtspUrl, socket);
    res.json({ 
      success: true, 
      message: 'WebRTC stream started',
      streamUrl: `https://localhost:${PORT}/webrtc/${streamId}.mp4`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/webrtc/stop/:streamId', (req, res) => {
  const { streamId } = req.params;
  stopWebRTCStream(streamId);
  res.json({ success: true, message: 'WebRTC stream stopped' });
});

app.get('/api/webrtc/status/:streamId', (req, res) => {
  const { streamId } = req.params;
  const isActive = activeStreams.has(streamId);
  const outputPath = path.join(__dirname, 'webrtc', `${streamId}.mp4`);
  const fileExists = fs.existsSync(outputPath);
  
  res.json({ 
    active: isActive,
    fileReady: fileExists,
    streamUrl: fileExists ? `https://localhost:${PORT}/webrtc/${streamId}.mp4` : null,
    clients: clients.size
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    type: 'WebRTC Server',
    activeStreams: activeStreams.size,
    connectedClients: clients.size,
    timestamp: new Date().toISOString()
  });
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebRTC server...');
  activeStreams.forEach((command, streamId) => {
    console.log(`Stopping WebRTC stream: ${streamId}`);
    command.kill('SIGKILL');
  });
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`
🚀 WebRTC-RTSP Server Started!
📡 Server: https://localhost:${PORT}
🔌 WebSocket: ws://localhost:${PORT}
📁 WebRTC Files: ${path.join(__dirname, 'webrtc')}
🔗 Health: https://localhost:${PORT}/health

📝 Usage Examples:
   WebSocket Connection: Connect to ws://localhost:${PORT}
   Start Stream: Emit 'start-stream' with {rtspUrl: 'your-rtsp-url'}
   Stream Status: GET /api/webrtc/status/:streamId
   Stop Stream: GET /api/webrtc/stop/:streamId
  `);
});