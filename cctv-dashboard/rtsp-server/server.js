const express = require('express');
const https = require('https');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

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

// Enable CORS for all routes
app.use(cors());

// Serve static files (HLS segments and playlists)
app.use('/hls', express.static(path.join(__dirname, 'hls')));

// Create HLS directory if it doesn't exist
const hlsDir = path.join(__dirname, 'hls');
if (!fs.existsSync(hlsDir)) {
  fs.mkdirSync(hlsDir, { recursive: true });
}

// Active streams storage
const activeStreams = new Map();

// Convert RTSP to HLS
function startRTSPToHLS(rtspUrl, streamId) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(hlsDir, `${streamId}.m3u8`);
    
    console.log(`🔄 Starting RTSP to HLS conversion: ${rtspUrl}`);
    console.log(`📁 Output path: ${outputPath}`);

    const command = ffmpeg(rtspUrl)
      .inputOptions([
        '-rtsp_transport', 'tcp',
        '-timeout', '5000000', // Changed from -stimeout to -timeout
      ])
      .outputOptions([
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-ac', '1',
        '-strict', '-2',
        '-crf', '18',
        '-profile:v', 'baseline',
        '-maxrate', '400k',
        '-bufsize', '1835k',
        '-pix_fmt', 'yuv420p',
        '-hls_flags', 'delete_segments+append_list',
        '-f', 'hls',
        '-hls_time', '6',
        '-hls_list_size', '10',
        '-hls_segment_filename', path.join(hlsDir, `${streamId}_%03d.ts`)
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('✅ FFmpeg process started:', commandLine);
        resolve(command);
      })
      .on('progress', (progress) => {
        if (progress.frames && progress.frames % 100 === 0) {
          console.log(`📊 Processing: ${progress.frames} frames, ${progress.currentFps} fps`);
        }
      })
      .on('error', (err, stdout, stderr) => {
        console.error('❌ FFmpeg error:', err.message);
        console.error('FFmpeg stderr:', stderr);
        activeStreams.delete(streamId);
        reject(err);
      })
      .on('end', () => {
        console.log('🏁 FFmpeg process ended');
        activeStreams.delete(streamId);
      });

    // Store the command for later cleanup
    activeStreams.set(streamId, command);
    
    // Start the conversion
    command.run();
  });
}

// API Routes
app.get('/api/start-stream/:streamId', async (req, res) => {
  const { streamId } = req.params;
  const { rtspUrl } = req.query;

  if (!rtspUrl) {
    return res.status(400).json({ error: 'RTSP URL is required' });
  }

  try {
    // Check if stream is already active
    if (activeStreams.has(streamId)) {
      return res.json({ 
        success: true, 
        message: 'Stream already active',
        hlsUrl: `https://localhost:${PORT}/hls/${streamId}.m3u8`
      });
    }

    await startRTSPToHLS(rtspUrl, streamId);
    
    res.json({ 
      success: true, 
      message: 'Stream started successfully',
      hlsUrl: `https://localhost:${PORT}/hls/${streamId}.m3u8`
    });

  } catch (error) {
    console.error('Stream start error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/stop-stream/:streamId', (req, res) => {
  const { streamId } = req.params;
  
  const command = activeStreams.get(streamId);
  if (command) {
    command.kill('SIGKILL');
    activeStreams.delete(streamId);
    
    // Clean up HLS files
    const hlsPattern = path.join(hlsDir, `${streamId}*`);
    const glob = require('glob');
    glob.sync(hlsPattern).forEach(file => {
      fs.unlinkSync(file);
    });
    
    res.json({ success: true, message: 'Stream stopped' });
  } else {
    res.json({ success: false, message: 'Stream not found' });
  }
});

app.get('/api/stream-status/:streamId', (req, res) => {
  const { streamId } = req.params;
  const isActive = activeStreams.has(streamId);
  const hlsFile = path.join(hlsDir, `${streamId}.m3u8`);
  const hlsExists = fs.existsSync(hlsFile);
  
  res.json({ 
    active: isActive,
    hlsReady: hlsExists,
    hlsUrl: hlsExists ? `https://localhost:${PORT}/hls/${streamId}.m3u8` : null
  });
});

// Get list of available HLS files
app.get('/api/hls-files', (req, res) => {
  try {
    const files = fs.readdirSync(hlsDir);
    res.json(files.sort((a, b) => {
      const statA = fs.statSync(path.join(hlsDir, a));
      const statB = fs.statSync(path.join(hlsDir, b));
      return statB.mtime.getTime() - statA.mtime.getTime(); // newest first
    }));
  } catch (error) {
    res.status(500).json({ error: 'Could not read HLS directory' });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    activeStreams: activeStreams.size,
    timestamp: new Date().toISOString()
  });
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down RTSP server...');
  activeStreams.forEach((command, streamId) => {
    console.log(`Stopping stream: ${streamId}`);
    command.kill('SIGKILL');
  });
  process.exit(0);
});

// SSL certificate configuration
let server;
try {
  const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, '..', 'localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '..', 'localhost+2.pem'))
  };
  server = https.createServer(sslOptions, app);
  console.log('✅ SSL certificates loaded for RTSP server');
} catch (error) {
  console.log('⚠️  SSL certificates not found, falling back to HTTP');
  server = require('http').createServer(app);
}

server.listen(PORT, () => {
  console.log(`
🚀 RTSP-HLS Server Started!
📡 Server: https://localhost:${PORT}
📁 HLS Files: ${hlsDir}
🔗 Health: https://localhost:${PORT}/health

📝 Usage Examples:
   Start Stream: GET /api/start-stream/cam1?rtspUrl=rtsp://192.168.137.106:8554/stream
   Stream Status: GET /api/stream-status/cam1  
   Stop Stream: GET /api/stop-stream/cam1
  `);
});