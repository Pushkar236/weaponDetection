"use client";

import React, { useState, useEffect } from "react";
import CCTVFeed, { DetectionData } from "../../components/CCTVFeed";
import Toast from "../../components/Toast";
import LogsPanel from "../../components/LogsPanel";
import CameraManager from "../components/CameraManager";
import StatsOverlay from "../../components/StatsOverlay";

export interface Camera {
  id: string;
  name: string;
  type: "default" | "user";
  deviceId?: string;
  url?: string;
}

export default function Dashboard() {
  const [detections, setDetections] = useState<DetectionData[]>([]);
  const [currentToast, setCurrentToast] = useState<DetectionData | null>(null);
  const [showCameraManager, setShowCameraManager] = useState(false);
  const [showStatsOverlay, setShowStatsOverlay] = useState(false);
  const [userCameras, setUserCameras] = useState<Camera[]>([]);

  // Default camera feeds
  const cameraCount = 4;
  const defaultCameras: Camera[] = Array.from(
    { length: cameraCount },
    (_, i) => ({
      id: `CAM-${String(i + 1).padStart(2, "0")}`,
      name: `CAM-${String(i + 1).padStart(2, "0")}`,
      type: "default" as const,
    })
  );

  // Combine default and user cameras
  const allCameras = [...defaultCameras, ...userCameras];

  // Load user cameras from localStorage on mount
  useEffect(() => {
    const savedCameras = localStorage.getItem("userCameras");
    if (savedCameras) {
      try {
        setUserCameras(JSON.parse(savedCameras));
      } catch (error) {
        console.error("Failed to load saved cameras:", error);
      }
    }
  }, []);

  // Save user cameras to localStorage whenever they change
  useEffect(() => {
    if (userCameras.length > 0) {
      localStorage.setItem("userCameras", JSON.stringify(userCameras));
    }
  }, [userCameras]);

  const handleAddCamera = (camera: Omit<Camera, "id">) => {
    const newCamera: Camera = {
      ...camera,
      id: `USER-${Date.now()}`,
    };
    setUserCameras((prev) => [...prev, newCamera]);
  };

  const handleRemoveCamera = (cameraId: string) => {
    setUserCameras((prev) => prev.filter((cam) => cam.id !== cameraId));
  };

  const handleDetection = (detection: DetectionData) => {
    // Add to detections list (newest first)
    setDetections((prev) => [detection, ...prev]);

    // Show toast notification
    setCurrentToast(detection);

    // Play alert sound
    playAlertSound();

    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      setCurrentToast(null);
    }, 5000);
  };

  const playAlertSound = () => {
    // Create a simple beep sound using Web Audio API
    if (typeof window !== "undefined" && "AudioContext" in window) {
      const audioContext = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext!)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // High pitched beep
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.3,
        audioContext.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-green-400">
      {/* Enhanced Header */}
      <header className="bg-black border-b-4 border-green-500 p-4 shadow-lg shadow-green-500/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-3xl animate-pulse">🛡️</div>
            <div>
              <h1 className="text-3xl font-mono font-bold text-green-400 tracking-wider">
                CCTV WEAPON DETECTION SYSTEM
              </h1>
              <p className="text-green-400/70 text-sm font-mono">
                🔍 Real-time Surveillance & Threat Detection • AI-Powered
                Security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-sm">
            {/* Quick Stats */}
            <div className="bg-gray-800 border border-green-500 rounded-lg p-2 flex items-center gap-2">
              <div className="text-yellow-400">⚠️</div>
              <div>
                <div className="text-xs text-green-400/70">
                  DETECTIONS TODAY
                </div>
                <div className="font-bold text-yellow-400">
                  {
                    detections.filter((d) => {
                      const today = new Date();
                      const detectionDate = new Date(d.timestamp);
                      return (
                        detectionDate.toDateString() === today.toDateString()
                      );
                    }).length
                  }
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-green-500 rounded-lg p-2 flex items-center gap-2">
              <div className="text-red-400">🚨</div>
              <div>
                <div className="text-xs text-green-400/70">HIGH SEVERITY</div>
                <div className="font-bold text-red-400">
                  {detections.filter((d) => d.severity === "high").length}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowStatsOverlay(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg border border-blue-400 transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
            >
              📊 STATS
            </button>

            <button
              onClick={() => setShowCameraManager(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-black font-semibold rounded-lg border border-green-400 transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
            >
              📹 CAMERAS
            </button>

            <div className="bg-gray-800 border border-green-500 rounded-lg p-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-bold">SYSTEM ACTIVE</span>
            </div>

            <div className="text-green-400/70 bg-gray-800 border border-green-500 rounded-lg p-2">
              <div className="text-xs">CURRENT TIME</div>
              <div className="font-bold">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Main content area with enhanced grid */}
        <div className="flex-1 p-6">
          {/* Grid Header */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-mono font-bold text-green-400 flex items-center gap-2">
              📹 LIVE CAMERA FEEDS
              <span className="text-sm bg-green-500/20 px-2 py-1 rounded border border-green-500">
                {allCameras.length} Active
              </span>
            </h2>
            <div className="flex items-center gap-2 text-sm font-mono">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400">Real-time Monitoring</span>
            </div>
          </div>

          {/* Enhanced Camera Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 h-[calc(100%-60px)]">
            {allCameras.map((camera, index) => (
              <div key={camera.id} className="relative group">
                {/* Camera Container with Enhanced Styling */}
                <div className="aspect-video bg-gray-800 rounded-xl border-2 border-green-500/50 hover:border-green-500 transition-all duration-300 shadow-lg shadow-green-500/10 hover:shadow-green-500/20 overflow-hidden">
                  {/* Camera Status Badge */}
                  <div className="absolute top-3 left-3 z-10 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-green-500/50">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 font-bold">
                        {camera.name}
                      </span>
                    </div>
                  </div>

                  {/* Camera Feed */}
                  <CCTVFeed
                    cameraName={camera.name}
                    camera={camera}
                    onDetection={handleDetection}
                  />

                  {/* Enhanced Camera Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
                    <div className="flex items-center justify-between text-green-400 font-mono text-sm">
                      <div>
                        <div className="font-bold">{camera.name}</div>
                        <div className="text-xs text-green-400/70">
                          {camera.type === "default"
                            ? "System Camera"
                            : "User Added"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-green-400/70">
                          DETECTIONS
                        </div>
                        <div className="font-bold text-yellow-400">
                          {
                            detections.filter((d) => d.location === camera.name)
                              .length
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Camera Placeholder (if less than 4 cameras) */}
            {allCameras.length < 8 && (
              <div
                onClick={() => setShowCameraManager(true)}
                className="aspect-video bg-gray-800/50 rounded-xl border-2 border-dashed border-green-500/30 hover:border-green-500/70 transition-all duration-300 cursor-pointer group flex items-center justify-center"
              >
                <div className="text-center text-green-400/70 group-hover:text-green-400 transition-colors">
                  <div className="text-4xl mb-2">➕</div>
                  <div className="font-mono font-bold">ADD CAMERA</div>
                  <div className="text-sm">Click to add new camera feed</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Right sidebar - Logs Panel */}
        <div className="w-96 bg-gradient-to-b from-gray-900 to-black border-l-4 border-green-500">
          <LogsPanel detections={detections} />
        </div>
      </div>

      {/* Enhanced Toast notification */}
      {currentToast && (
        <Toast detection={currentToast} onClose={() => setCurrentToast(null)} />
      )}

      {/* Stats Overlay */}
      <StatsOverlay
        detections={detections}
        activeCameras={allCameras.length}
        isVisible={showStatsOverlay}
        onClose={() => setShowStatsOverlay(false)}
      />

      {/* Camera Manager Modal */}
      {showCameraManager && (
        <CameraManager
          userCameras={userCameras}
          onAddCamera={handleAddCamera}
          onRemoveCamera={handleRemoveCamera}
          onClose={() => setShowCameraManager(false)}
        />
      )}
    </div>
  );
}
