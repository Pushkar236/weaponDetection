"use client";

import React, { useState, useEffect } from "react";
import CCTVFeed, { DetectionData } from "../../components/CCTVFeed";
import Toast from "../../components/Toast";
import LogsPanel from "../../components/LogsPanel";

export default function Dashboard() {
  const [detections, setDetections] = useState<DetectionData[]>([]);
  const [currentToast, setCurrentToast] = useState<DetectionData | null>(null);

  // Number of camera feeds to display
  const cameraCount = 4;
  const cameras = Array.from({ length: cameraCount }, (_, i) => ({
    id: `CAM-${String(i + 1).padStart(2, "0")}`,
    name: `CAM-${String(i + 1).padStart(2, "0")}`,
  }));

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
        (window as any).webkitAudioContext)();
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
    <div className="min-h-screen bg-gray-900 text-green-400">
      {/* Header */}
      <header className="bg-black border-b-2 border-green-500 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-2xl">🛡️</div>
            <div>
              <h1 className="text-2xl font-mono font-bold text-green-400">
                CCTV WEAPON DETECTION SYSTEM
              </h1>
              <p className="text-green-400/70 text-sm font-mono">
                Real-time Surveillance & Threat Detection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>SYSTEM ACTIVE</span>
            </div>
            <div className="text-green-400/70">
              {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main content area */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 h-full">
            {cameras.map((camera) => (
              <div key={camera.id} className="aspect-video">
                <CCTVFeed
                  cameraName={camera.name}
                  onDetection={handleDetection}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar - Logs Panel */}
        <div className="w-80 bg-gray-900">
          <LogsPanel detections={detections} />
        </div>
      </div>

      {/* Toast notification */}
      {currentToast && (
        <Toast detection={currentToast} onClose={() => setCurrentToast(null)} />
      )}
    </div>
  );
}
