"use client";

import React, { useRef, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface WebRTCStreamProps {
  rtspUrl: string;
  streamId: string;
  title: string;
  onDetection?: (detection: any) => void;
}

export default function WebRTCStream({
  rtspUrl,
  streamId,
  title,
  onDetection,
}: WebRTCStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>("");
  const [stats, setStats] = useState({ frames: 0, fps: 0, bitrate: 0 });

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io("https://localhost:3003");
    setSocket(newSocket);

    // Socket event handlers
    newSocket.on("connect", () => {
      console.log("🔌 Connected to WebRTC server");
    });

    newSocket.on("stream-started", (data: any) => {
      console.log("🎬 Stream started:", data);
      setIsStreaming(true);
      setIsConnecting(false);
      setError("");
    });

    newSocket.on("stream-progress", (progress: any) => {
      setStats({
        frames: progress.frames || 0,
        fps: Math.round(progress.fps || 0),
        bitrate: Math.round(progress.bitrate || 0),
      });
    });

    newSocket.on("stream-error", (errorData: any) => {
      console.error("❌ Stream error:", errorData);
      setError(errorData.error || "Stream error occurred");
      setIsConnecting(false);
      setIsStreaming(false);
    });

    newSocket.on("stream-ended", () => {
      console.log("🏁 Stream ended");
      setIsStreaming(false);
      setIsConnecting(false);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from WebRTC server");
      setIsStreaming(false);
      setIsConnecting(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const startStream = async () => {
    if (!socket) {
      setError("WebSocket not connected");
      return;
    }

    setIsConnecting(true);
    setError("");

    // Handle local webcam differently
    if (rtspUrl.startsWith("webcam://")) {
      console.log(`📹 Starting local webcam stream for: ${title}`);
      await startWebcamStream();
      return;
    }

    console.log(`🎬 Starting WebRTC stream: ${rtspUrl}`);
    socket.emit("start-stream", { rtspUrl, streamId });

    // Try to load video after a delay
    setTimeout(() => {
      loadVideo();
    }, 3000);
  };

  const startWebcamStream = async () => {
    try {
      console.log("📹 Attempting to access local webcam...");

      // Check if running over httpsS or localhost
      const isSecureContext =
        window.isSecureContext ||
        location.protocol === "httpss:" ||
        location.hostname === "localhost";

      if (!isSecureContext) {
        throw new Error(
          "Camera access requires httpsS or localhost. Current protocol: " +
            location.protocol
        );
      }

      // Check for modern getUserMedia API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Try legacy getUserMedia as fallback
        const legacyGetUserMedia =
          (navigator as any).getUserMedia ||
          (navigator as any).webkitGetUserMedia ||
          (navigator as any).mozGetUserMedia;

        if (!legacyGetUserMedia) {
          throw new Error("No camera API available in this browser");
        }

        console.log("🔄 Using legacy getUserMedia API");
        const stream = await new Promise<MediaStream>((resolve, reject) => {
          legacyGetUserMedia.call(
            navigator,
            {
              video: { width: 640, height: 480 },
              audio: false,
            },
            resolve,
            reject
          );
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } else {
        // Modern API
        console.log("✅ Using modern getUserMedia API");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: "user",
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      }

      setIsStreaming(true);
      setIsConnecting(false);
      setError("");

      // Simulate some stats for local webcam
      setStats({ frames: 30, fps: 30, bitrate: 1000 });
      console.log("✅ Webcam stream started successfully");
    } catch (err) {
      console.error("Failed to access webcam:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Camera access failed: ${errorMessage}`);
      setIsConnecting(false);

      // Show helpful message in video element
      if (videoRef.current) {
        videoRef.current.style.backgroundColor = "#1f2937";
        videoRef.current.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #ef4444; text-align: center; padding: 20px;">
            <div style="font-size: 3rem; margin-bottom: 10px;">📹</div>
            <div style="font-weight: bold; margin-bottom: 10px;">Camera Access Required</div>
            <div style="font-size: 0.9rem; opacity: 0.8; line-height: 1.4;">
              Please allow camera permissions<br>
              or access via httpsS for webcam functionality
            </div>
          </div>
        `;
      }
    }
  };

  const loadVideo = async () => {
    if (!videoRef.current) return;

    try {
      const streamUrl = `https://localhost:3003/webrtc/${streamId}.mp4`;
      console.log("📺 Loading video:", streamUrl);

      videoRef.current.src = streamUrl;
      videoRef.current.load();

      // Auto-play when loaded
      videoRef.current.addEventListener("loadeddata", () => {
        if (videoRef.current) {
          videoRef.current.play().catch(console.error);
        }
      });
    } catch (err) {
      console.error("Failed to load video:", err);
      setError("Failed to load video stream");
    }
  };

  const stopStream = () => {
    // Stop WebRTC socket connection for RTSP streams
    if (socket && !rtspUrl.startsWith("webcam://")) {
      socket.disconnect();
    }

    if (videoRef.current) {
      // For webcam streams, stop the media stream
      if (rtspUrl.startsWith("webcam://") && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      } else {
        // For RTSP streams, clear the src
        videoRef.current.pause();
        videoRef.current.src = "";
      }
    }

    setIsStreaming(false);
    setIsConnecting(false);
    setStats({ frames: 0, fps: 0, bitrate: 0 });
  };

  // Simulate weapon detection
  const simulateWeaponDetection = () => {
    const weapons = ["Handgun", "Rifle", "Knife", "Suspicious Object"];
    const detection = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      weaponType: weapons[Math.floor(Math.random() * weapons.length)],
      confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
      cameraName: title,
      location: "Camera Feed",
      severity: "high" as const,
      screenshot: "data:image/png;base64,placeholder",
    };

    if (onDetection) {
      onDetection(detection);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-700 px-4 py-2 flex justify-between items-center">
        <h3 className="text-white font-semibold">{title}</h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isStreaming
                ? "bg-green-500"
                : isConnecting
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          ></div>
          <span className="text-xs text-gray-300">
            {isStreaming ? "LIVE" : isConnecting ? "CONNECTING" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          onError={(e) => setError("Video playback error")}
        />

        {/* Overlay when not streaming */}
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80">
            <div className="text-center text-gray-300">
              {isConnecting ? (
                <>
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>Connecting to stream...</p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">📹</div>
                  <p>Click Start to begin streaming</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Stats Overlay */}
        {isStreaming && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            <div>FPS: {stats.fps}</div>
            <div>Frames: {stats.frames}</div>
            <div>Bitrate: {stats.bitrate}k</div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 p-2 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-700 px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={startStream}
              disabled={isConnecting || isStreaming}
              className={`px-3 py-1 rounded text-sm font-semibold ${
                isConnecting || isStreaming
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {isConnecting ? "Starting..." : "Start"}
            </button>

            <button
              onClick={stopStream}
              disabled={!isConnecting && !isStreaming}
              className={`px-3 py-1 rounded text-sm font-semibold ${
                !isConnecting && !isStreaming
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              Stop
            </button>

            <button
              onClick={simulateWeaponDetection}
              className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-semibold"
            >
              Test Alert
            </button>
          </div>

          <div className="text-xs text-gray-400">WebRTC Stream</div>
        </div>
      </div>
    </div>
  );
}
