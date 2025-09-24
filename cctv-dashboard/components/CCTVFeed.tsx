"use client";

import React, { useRef, useState, useEffect } from "react";

export interface DetectionData {
  id: string;
  weaponType: string;
  confidence: number;
  timestamp: string;
  location: string;
  screenshot: string;
}

interface CCTVFeedProps {
  cameraName: string;
  onDetection: (detection: DetectionData) => void;
}

const CCTVFeed: React.FC<CCTVFeedProps> = ({ cameraName, onDetection }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Initialize webcam stream
  useEffect(() => {
    const initWebcam = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };

    initWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Update stream when video ref is available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Update timestamp every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const captureFrame = (): Promise<string> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        resolve("");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        } else {
          resolve("");
        }
      }, "image/png");
    });
  };

  const simulateDetection = async () => {
    if (isDetecting) return;

    setIsDetecting(true);

    const weaponTypes = [
      "Handgun",
      "Rifle",
      "Knife",
      "Suspicious Object",
      "Explosive Device",
      "Metal Weapon",
    ];

    const randomWeapon =
      weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
    const randomConfidence = Math.floor(Math.random() * 40) + 60; // 60-99%

    const screenshot = await captureFrame();

    const detection: DetectionData = {
      id: Date.now().toString(),
      weaponType: randomWeapon,
      confidence: randomConfidence,
      timestamp: new Date().toISOString(),
      location: cameraName,
      screenshot,
    };

    // Simulate detection delay
    setTimeout(() => {
      onDetection(detection);
      setIsDetecting(false);

      // Console logs for webhook and email simulation
      console.log(
        `🚨 WEAPON DETECTED - Webhook URL: https://api.security-system.com/webhook/${detection.id}`
      );
      console.log(
        `📧 Email sent to admin with screenshot - Detection ID: ${detection.id}`
      );
    }, 1000);
  };

  const saveFrame = async () => {
    const screenshot = await captureFrame();
    if (screenshot) {
      const link = document.createElement("a");
      link.href = screenshot;
      link.download = `${cameraName}-frame.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="relative bg-black rounded-lg overflow-hidden border-2 border-green-500 shadow-lg shadow-green-500/30 h-full">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top bar overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-3">
        <div className="flex justify-between items-center text-green-400 font-mono text-sm">
          <div className="bg-black/50 border border-green-500 px-2 py-1 rounded text-xs font-bold">
            {cameraName}
          </div>
          <div className="text-xs">{currentTime}</div>
        </div>
      </div>

      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        className="w-full h-full object-cover"
        style={{ filter: "hue-rotate(90deg) saturate(1.2) brightness(0.9)" }}
      />

      {/* Green tint overlay */}
      <div className="absolute inset-0 bg-green-500/10 mix-blend-multiply pointer-events-none"></div>

      {/* Scanlines effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 0, 0.1) 2px,
            rgba(0, 255, 0, 0.1) 4px
          )`,
          animation: "scanlines 0.1s linear infinite",
        }}
      ></div>

      {/* Control buttons */}
      <div className="absolute bottom-3 right-3 z-20 flex gap-2">
        <button
          onClick={saveFrame}
          className="bg-black/80 border border-green-500 text-green-400 px-3 py-1 rounded text-xs font-mono hover:bg-green-500/20 transition-colors"
        >
          📸 SAVE
        </button>
        <button
          onClick={simulateDetection}
          disabled={isDetecting}
          className={`border px-3 py-1 rounded text-xs font-mono transition-colors ${
            isDetecting
              ? "bg-red-600/80 border-red-500 text-red-200 cursor-not-allowed"
              : "bg-black/80 border-orange-500 text-orange-400 hover:bg-orange-500/20"
          }`}
        >
          {isDetecting ? "🔍 DETECTING..." : "⚠️ SIMULATE"}
        </button>
      </div>

      {/* Detection overlay when detecting */}
      {isDetecting && (
        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center z-30">
          <div className="bg-black/80 border-2 border-red-500 text-red-400 px-6 py-4 rounded font-mono text-center animate-pulse">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-sm font-bold">WEAPON DETECTION</div>
            <div className="text-xs">ANALYZING...</div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scanlines {
          0% {
            transform: translateY(0px);
          }
          100% {
            transform: translateY(4px);
          }
        }
      `}</style>
    </div>
  );
};

export default CCTVFeed;
