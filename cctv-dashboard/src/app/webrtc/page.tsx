"use client";

import React, { useState, useEffect } from "react";
import WebRTCStream from "../../../components/WebRTCStream";
import Toast from "../../../components/Toast";
import LogsPanel from "../../../components/LogsPanel";

export interface DetectionData {
  id: string;
  timestamp: string;
  weaponType: string;
  confidence: number;
  cameraName: string;
  location: string;
  severity: "low" | "medium" | "high";
  screenshot: string;
}

export default function WebRTCDashboard() {
  const [detections, setDetections] = useState<DetectionData[]>([]);
  const [currentToast, setCurrentToast] = useState<DetectionData | null>(null);

  // Camera configuration
  const cameras = [
    {
      id: "webrtc_cam_01",
      title: "Main Entrance - WebRTC",
      rtspUrl: "rtsp://192.168.137.106:8554/stream",
      location: "Building A - Main Entrance",
    },
    {
      id: "webrtc_cam_02",
      title: "Parking Area - WebRTC",
      rtspUrl: "rtsp://192.168.137.106:8554/stream",
      location: "Building B - Parking Lot",
    },
    {
      id: "webrtc_cam_03",
      title: "Perimeter - WebRTC",
      rtspUrl: "rtsp://192.168.137.106:8554/stream",
      location: "Perimeter - North Gate",
    },
    {
      id: "webrtc_cam_04",
      title: "Local Webcam - WebRTC",
      rtspUrl: "webcam://local", // Special identifier for webcam
      location: "Local System Camera",
    },
  ];

  const handleDetection = (detection: DetectionData) => {
    // Add to detections list (newest first)
    setDetections((prev) => [detection, ...prev]);

    // Show toast notification
    setCurrentToast(detection);

    // Play alert sound
    playAlertSound();

    // Send email alert (simulated)
    sendEmailAlert(detection);

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

      oscillator.frequency.value = 800;
      oscillator.type = "square";

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.3,
        audioContext.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  const sendEmailAlert = async (detection: DetectionData) => {
    console.log("📧 Sending email alert:", detection);
    // Here you would integrate with your email service
    // For now, we'll just log it
    try {
      // Simulate API call
      const response = await fetch("/api/send-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(detection),
      });
      console.log("📧 Email alert sent successfully");
    } catch (error) {
      console.error("❌ Failed to send email alert:", error);
    }
  };

  const clearDetections = () => {
    setDetections([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              🔴 CCTV Weapon Detection - WebRTC Dashboard
            </h1>
            <p className="text-gray-400">
              Real-time surveillance with AI-powered weapon detection using
              WebRTC streaming
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {cameras.length} Cameras
            </div>
            <div className="text-sm text-gray-400">WebRTC Active</div>
          </div>
        </div>
      </header>

      {/* Server Status */}
      <div className="mb-6 bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-3">🔧 System Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">Dashboard Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">WebRTC Server</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm">FFmpeg Ready</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm">AI Detection</span>
          </div>
        </div>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {cameras.map((camera) => (
          <WebRTCStream
            key={camera.id}
            streamId={camera.id}
            title={camera.title}
            rtspUrl={camera.rtspUrl}
            onDetection={handleDetection}
          />
        ))}
      </div>

      {/* Detection Logs Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <LogsPanel detections={detections} onClear={clearDetections} />
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">📊 Detection Stats</h3>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Alerts:</span>
              <span className="font-bold text-red-400">
                {detections.length}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">High Priority:</span>
              <span className="font-bold text-red-500">
                {detections.filter((d) => d.severity === "high").length}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Last 24h:</span>
              <span className="font-bold text-yellow-400">
                {
                  detections.filter(
                    (d) =>
                      new Date(d.timestamp).getTime() > Date.now() - 86400000
                  ).length
                }
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Avg Confidence:</span>
              <span className="font-bold text-green-400">
                {detections.length > 0
                  ? Math.round(
                      detections.reduce((acc, d) => acc + d.confidence, 0) /
                        detections.length
                    )
                  : 0}
                %
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <h4 className="font-semibold mb-2">🎯 WebRTC Features</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>✅ Ultra-low latency streaming</li>
              <li>✅ Real-time video processing</li>
              <li>✅ Adaptive bitrate control</li>
              <li>✅ Direct browser support</li>
              <li>✅ No plugin required</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {currentToast && (
        <Toast detection={currentToast} onClose={() => setCurrentToast(null)} />
      )}
    </div>
  );
}
