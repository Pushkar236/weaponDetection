"use client";

import React, { useRef, useState, useEffect } from "react";
import CurrentTime from "./CurrentTime";

interface RTSPTestProps {
  rtspUrl: string;
  cameraName: string;
}

const RTSPTest: React.FC<RTSPTestProps> = ({ rtspUrl, cameraName }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "failed" | "converting"
  >("connecting");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [hlsUrl, setHlsUrl] = useState<string>("");
  const [serverRunning, setServerRunning] = useState<boolean>(false);

  useEffect(() => {
    const streamId = `cam_${cameraName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase()}`;

    const checkServerAndStartStream = async () => {
      setConnectionStatus("connecting");
      setErrorMessage("");

      try {
        // First, check if RTSP server is running
        const healthResponse = await fetch("https://localhost:3002/health");
        if (!healthResponse.ok) {
          throw new Error("RTSP conversion server not running");
        }

        setServerRunning(true);
        setConnectionStatus("converting");

        console.log(`🔄 Starting RTSP stream conversion: ${rtspUrl}`);

        // Start RTSP to HLS conversion
        const startResponse = await fetch(
          `https://localhost:3002/api/start-stream/${streamId}?rtspUrl=${encodeURIComponent(
            rtspUrl
          )}`
        );

        const startResult = await startResponse.json();

        if (!startResult.success) {
          throw new Error(
            startResult.error || "Failed to start stream conversion"
          );
        }

        setHlsUrl(startResult.hlsUrl);

        // Wait for HLS playlist to be ready
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds timeout

        const checkHLS = async () => {
          try {
            const statusResponse = await fetch(
              `https://localhost:3002/api/stream-status/${streamId}`
            );
            const status = await statusResponse.json();

            if (status.hlsReady && status.hlsUrl) {
              // Try to load the HLS stream
              if (videoRef.current) {
                videoRef.current.src = status.hlsUrl;
                videoRef.current.load();

                videoRef.current.onloadedmetadata = () => {
                  setConnectionStatus("connected");
                  console.log("✅ HLS stream loaded successfully");
                };

                videoRef.current.onerror = () => {
                  setConnectionStatus("failed");
                  setErrorMessage("Failed to load HLS stream");
                };
              }
            } else if (attempts < maxAttempts) {
              attempts++;
              setTimeout(checkHLS, 1000);
            } else {
              throw new Error("Timeout waiting for HLS stream");
            }
          } catch (error) {
            setConnectionStatus("failed");
            setErrorMessage(
              `HLS check failed: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        };

        // Start checking for HLS readiness
        setTimeout(checkHLS, 2000);
      } catch (error) {
        console.error("RTSP connection error:", error);
        setConnectionStatus("failed");
        setServerRunning(false);

        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("server not running")) {
          setErrorMessage(
            "RTSP conversion server not running. Please start: cd rtsp-server && npm start"
          );
        } else {
          setErrorMessage(`Connection failed: ${errorMessage}`);
        }
      }
    };

    checkServerAndStartStream();

    // Cleanup on unmount
    return () => {
      if (serverRunning) {
        fetch(`https://localhost:3002/api/stop-stream/${streamId}`).catch(
          console.error
        );
      }
    };
  }, [rtspUrl, cameraName]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden border-2 border-green-500/30 shadow-lg">
      {/* Video Element */}
      {connectionStatus === "connected" && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          controls
          className="w-full h-full object-cover"
        />
      )}

      {/* Loading/Error State */}
      {connectionStatus !== "connected" && (
        <div className="aspect-video bg-gray-900 flex items-center justify-center">
          <div className="text-center p-4">
            {connectionStatus === "connecting" && (
              <div className="text-yellow-400">
                <div className="text-2xl mb-2">🔄</div>
                <div>Connecting to RTSP server...</div>
              </div>
            )}
            {connectionStatus === "converting" && (
              <div className="text-blue-400">
                <div className="text-2xl mb-2">⚙️</div>
                <div>Converting RTSP to HLS...</div>
                <div className="text-xs mt-1">This may take 10-30 seconds</div>
              </div>
            )}
            {connectionStatus === "failed" && (
              <div className="text-red-400">
                <div className="text-2xl mb-2">❌</div>
                <div>Connection Failed</div>
                <div className="text-xs mt-2 max-w-xs">{errorMessage}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Camera Info Overlay */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-3">
        <div className="flex justify-between items-start">
          <div className="text-green-400 font-mono">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
                    : connectionStatus === "converting"
                    ? "bg-yellow-500"
                    : connectionStatus === "connecting"
                    ? "bg-blue-500"
                    : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm font-bold">{cameraName}</span>
            </div>
            <div className="text-xs text-green-400/70 mt-1">
              {connectionStatus === "connected"
                ? "� LIVE RTSP"
                : connectionStatus === "converting"
                ? "🔄 CONVERTING"
                : connectionStatus === "connecting"
                ? "🔗 CONNECTING"
                : "🔴 OFFLINE"}
            </div>
          </div>

          <div className="text-right text-green-400 font-mono text-xs">
            <div>
              <CurrentTime />
            </div>
            {hlsUrl && (
              <div className="text-blue-400/70 mt-1 max-w-24 truncate">
                HLS Ready
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="font-mono text-xs space-y-1">
          <div>
            <span className="text-gray-400">RTSP:</span>{" "}
            <span className="text-blue-400">{rtspUrl}</span>
          </div>
          {hlsUrl && (
            <div>
              <span className="text-gray-400">HLS:</span>{" "}
              <span className="text-green-400">Available</span>
            </div>
          )}
          {serverRunning && (
            <div>
              <span className="text-gray-400">Server:</span>{" "}
              <span className="text-green-400">Running on :3002</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RTSPTest;
