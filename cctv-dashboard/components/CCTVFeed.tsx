"use client";

import React, { useRef, useState, useEffect } from "react";
import { Camera } from "../src/app/page";

export interface DetectionData {
  id: string;
  weaponType: string;
  confidence: number;
  timestamp: string;
  location: string;
  screenshot: string;
  severity: "low" | "medium" | "high";
}

interface CCTVFeedProps {
  cameraName: string;
  camera?: Camera;
  onDetection: (detection: DetectionData) => void;
  active?: boolean; // Only send frames if true
}

const CCTVFeed: React.FC<CCTVFeedProps> = ({
  cameraName,
  camera,
  onDetection,
  active = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string>("");
  const [aiServerStatus, setAiServerStatus] = useState<
    "unknown" | "healthy" | "unhealthy"
  >("unknown");
  const [currentModel, setCurrentModel] = useState<"best" | "last">("best");
  const [lastDetectionCount, setLastDetectionCount] = useState<number>(0);
  const [isContinuousDetection, setIsContinuousDetection] = useState(false);
  const [isInitialAnalyzing, setIsInitialAnalyzing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check AI server status on component mount
  useEffect(() => {
    const checkAiServerStatus = async () => {
      try {
        const response = await fetch("/api/ai-detect");
        if (response.ok) {
          setAiServerStatus("healthy");
        } else {
          setAiServerStatus("unhealthy");
        }
      } catch (error) {
        setAiServerStatus("unhealthy");
      }
    };

    checkAiServerStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkAiServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize webcam stream
  useEffect(() => {
    const initWebcam = async () => {
      try {
        let mediaStream: MediaStream;

        if (camera?.type === "user") {
          // Handle user camera
          if (camera.deviceId) {
            // Access specific camera device with exact constraint
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { exact: camera.deviceId },
                width: 640,
                height: 480,
              },
            });
          } else if (camera.url) {
            // Handle URL stream (placeholder - would need additional implementation)
            console.log("URL streaming not fully implemented yet:", camera.url);
            setError("URL streaming requires additional setup");
            return;
          } else {
            throw new Error("Invalid user camera configuration");
          }
        } else {
          // Default camera behavior - get available devices and use different ones
          try {
            // Check if mediaDevices is supported
            if (
              !navigator.mediaDevices ||
              !navigator.mediaDevices.enumerateDevices
            ) {
              console.warn(
                "enumerateDevices not supported, using default camera"
              );
              // Use default camera constraints
              const defaultStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
              });
              setStream(defaultStream);
              if (videoRef.current) {
                videoRef.current.srcObject = defaultStream;
              }
              return;
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(
              (device) => device.kind === "videoinput"
            );

            // For default cameras, try to use different devices based on camera index
            const cameraIndex = parseInt(camera?.id?.split("-")[1] || "1") - 1;
            const deviceToUse = videoDevices[cameraIndex % videoDevices.length];

            if (deviceToUse && deviceToUse.deviceId) {
              mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                  deviceId: { exact: deviceToUse.deviceId },
                  width: 640,
                  height: 480,
                },
              });
            } else {
              // Fallback to default camera
              mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
              });
            }
          } catch (enumerateError) {
            console.warn(
              "Failed to enumerate devices, using default camera:",
              enumerateError
            );
            // Fallback to default camera
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: { width: 640, height: 480 },
            });
          }
        }

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError("");
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setError(
          `Failed to access camera: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    };

    initWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [camera]);

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

  const performAiDetection = async () => {
    if (isDetecting) return;
    setIsDetecting(true);

    try {
      // Capture current frame
      const screenshot = await captureFrame();

      if (!screenshot) {
        throw new Error("Failed to capture frame");
      }

      console.log("🤖 Sending frame to AI detection server...");

      // Send frame to AI detection API
      const response = await fetch("/api/ai-detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: screenshot,
          model: currentModel, // Use selected model
          confidence: 0.3, // Lower confidence threshold for more sensitive detection
        }),
      });

      const result = await response.json();

      if (result.success && result.detections && result.detections.length > 0) {
        console.log(
          `✅ AI Detection successful: Found ${result.detections.length} weapons`
        );
        setLastDetectionCount(result.detections.length);

        // Process each detection
        result.detections.forEach((detection: any, index: number) => {
          const confidence = Math.round(detection.confidence * 100);

          // Determine severity based on confidence and weapon type
          const severity: "low" | "medium" | "high" =
            confidence >= 90 ? "high" : confidence >= 75 ? "medium" : "low";

          const detectionData: DetectionData = {
            id: `${Date.now()}-${index}`,
            weaponType: detection.class || "Unknown Weapon",
            confidence: confidence,
            timestamp: new Date().toISOString(),
            location: cameraName,
            screenshot: result.annotated_image || screenshot, // Use annotated image if available
            severity,
          };

          onDetection(detectionData);

          // Log detection details
          console.log(
            `🎯 Weapon detected: ${detectionData.weaponType} (${confidence}% confidence)`
          );
        });
      } else if (result.success) {
        console.log("✅ AI scan complete - No weapons detected");
        setLastDetectionCount(0);
      } else {
        throw new Error(result.error || "AI detection failed");
      }
    } catch (error) {
      console.error("❌ AI detection failed:", error);

      // Show user-friendly error
      if (error instanceof Error) {
        if (error.message.includes("server is not running")) {
          setError(
            "AI Detection Server offline. Please start the Python server."
          );
        } else {
          setError(`AI Detection error: ${error.message}`);
        }
      }

      // Clear error after 5 seconds
      setTimeout(() => setError(""), 5000);
    } finally {
      // Wait for 2 seconds after getting response before allowing next detection
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsDetecting(false);
    }
  };

  const startContinuousDetection = () => {
    if (isContinuousDetection || aiServerStatus !== "healthy") return;

    setIsContinuousDetection(true);
    setIsInitialAnalyzing(true);
    console.log("🔄 Starting continuous AI detection...");

    // Show "WEAPON DETECTION ANALYZING.." for initial 3 seconds
    setTimeout(() => {
      setIsInitialAnalyzing(false);
    }, 3000);

    // Start with immediate detection
    performAiDetection();

    // Set up interval for continuous detection (every 3 seconds)
    intervalRef.current = setInterval(() => {
      if (!isDetecting) {
        performAiDetection();
      }
    }, 3000);
  };

  const stopContinuousDetection = () => {
    if (!isContinuousDetection) return;

    setIsContinuousDetection(false);
    setIsInitialAnalyzing(false); // Reset initial analyzing state
    console.log("⏹️ Stopping continuous AI detection...");

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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

    // Determine severity based on weapon type and confidence
    const severity: "low" | "medium" | "high" =
      randomConfidence >= 90
        ? "high"
        : randomConfidence >= 75
        ? "medium"
        : "low";

    const detection: DetectionData = {
      id: Date.now().toString(),
      weaponType: randomWeapon,
      confidence: randomConfidence,
      timestamp: new Date().toISOString(),
      location: cameraName,
      screenshot,
      severity,
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
          <div className="flex items-center gap-2">
            <div className="bg-black/50 border border-green-500 px-2 py-1 rounded text-xs font-bold">
              {cameraName}
              {camera?.type === "user" && (
                <span className="ml-2 text-blue-400">USER</span>
              )}
            </div>
            {/* AI Server Status Indicator */}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${
                aiServerStatus === "healthy"
                  ? "bg-green-900/50 border-green-500 text-green-400"
                  : aiServerStatus === "unhealthy"
                  ? "bg-red-900/50 border-red-500 text-red-400"
                  : "bg-yellow-900/50 border-yellow-500 text-yellow-400"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  aiServerStatus === "healthy"
                    ? "bg-green-400"
                    : aiServerStatus === "unhealthy"
                    ? "bg-red-400"
                    : "bg-yellow-400"
                }`}
              ></div>
              <span>AI</span>
            </div>
            {/* Continuous Detection Status */}
            {isContinuousDetection && (
              <div className="flex items-center gap-1 px-2 py-1 rounded text-xs border bg-green-900/50 border-green-500 text-green-300">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span>AUTO</span>
              </div>
            )}
            {/* Model Selector */}
            <div className="flex items-center gap-1 px-2 py-1 rounded text-xs border bg-black/50 border-blue-500 text-blue-400">
              <span className="text-[10px]">MODEL:</span>
              <button
                onClick={() =>
                  setCurrentModel(currentModel === "best" ? "last" : "best")
                }
                className="text-[10px] font-bold hover:text-white transition-colors"
              >
                {currentModel.toUpperCase()}
              </button>
            </div>
            {/* Detection Counter */}
            {lastDetectionCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded text-xs border bg-red-900/50 border-red-500 text-red-400">
                <span className="text-[10px]">DETECTED:</span>
                <span className="text-[10px] font-bold">
                  {lastDetectionCount}
                </span>
              </div>
            )}
          </div>
          <div className="text-xs">{currentTime}</div>
        </div>
      </div>
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
          <div className="bg-red-900/80 border-2 border-red-500 text-red-400 px-6 py-4 rounded font-mono text-center">
            <div className="text-2xl mb-2">❌</div>
            <div className="text-sm font-bold">CAMERA ERROR</div>
            <div className="text-xs">{error}</div>
          </div>
        </div>
      )}
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        className="w-full h-full object-cover"
      />
      {/* Detection indicator overlay */}
      {isDetecting && (
        <div className="absolute inset-0 bg-blue-500/20 animate-pulse pointer-events-none"></div>
      )}
      {/* Control buttons - Clean minimal UI */}
      <div className="absolute bottom-3 right-3 z-20 flex gap-2">
        <button
          onClick={saveFrame}
          className="bg-black/90 border border-green-500 text-green-400 px-2 py-1 rounded text-xs font-mono hover:bg-green-500/20 transition-all duration-200 shadow-md"
          title="Save screenshot"
        >
          📸
        </button>
        <button
          onClick={
            isContinuousDetection
              ? stopContinuousDetection
              : startContinuousDetection
          }
          disabled={
            (isDetecting && !isContinuousDetection) ||
            aiServerStatus !== "healthy"
          }
          className={`border px-3 py-1 rounded text-xs font-mono transition-all duration-200 shadow-md ${
            isContinuousDetection
              ? "bg-red-600/90 border-red-500 text-red-100 hover:bg-red-700/90"
              : isDetecting
              ? "bg-yellow-600/90 border-yellow-500 text-yellow-100 cursor-not-allowed"
              : aiServerStatus === "healthy"
              ? "bg-black/90 border-green-500 text-green-400 hover:bg-green-500/20"
              : "bg-black/90 border-gray-500 text-gray-400 cursor-not-allowed"
          }`}
          title={
            aiServerStatus !== "healthy"
              ? "AI Server offline"
              : isContinuousDetection
              ? "Stop continuous AI detection"
              : "Start continuous AI weapon detection"
          }
        >
          {isContinuousDetection
            ? "⏹️ STOP"
            : isDetecting
            ? "🤖 AI..."
            : "▶️ START"}
        </button>
        <button
          onClick={performAiDetection}
          disabled={
            isDetecting || isContinuousDetection || aiServerStatus !== "healthy"
          }
          className={`border px-2 py-1 rounded text-xs font-mono transition-all duration-200 shadow-md ${
            isDetecting || isContinuousDetection
              ? "bg-gray-600/90 border-gray-500 text-gray-400 cursor-not-allowed"
              : aiServerStatus === "healthy"
              ? "bg-black/90 border-blue-500 text-blue-400 hover:bg-blue-500/20"
              : "bg-black/90 border-gray-500 text-gray-400 cursor-not-allowed"
          }`}
          title={
            isContinuousDetection
              ? "Stop continuous mode first"
              : aiServerStatus !== "healthy"
              ? "AI Server offline"
              : "Run single AI weapon detection"
          }
        >
          🧠
        </button>
      </div>{" "}
      {/* Initial analyzing overlay - shown once for 3 seconds when starting continuous detection */}
      {isInitialAnalyzing && (
        <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center z-30">
          <div className="bg-black/90 border-2 border-blue-400 text-blue-300 px-8 py-6 rounded font-mono text-center">
            <div className="text-3xl mb-3 animate-spin">🤖</div>
            <div className="text-lg font-bold tracking-wider">
              WEAPON DETECTION
            </div>
            <div className="text-sm mt-1 animate-pulse">ANALYZING...</div>
            <div className="text-xs mt-2 text-blue-400">
              INITIALIZING CONTINUOUS SCAN
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        /* Keep styles for component if needed */
      `}</style>
    </div>
  );
};

export default CCTVFeed;
