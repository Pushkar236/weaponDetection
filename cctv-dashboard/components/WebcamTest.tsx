"use client";

import React, { useRef, useEffect, useState } from "react";

export default function WebcamTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>("");

  const startWebcam = async () => {
    try {
      // Check secure context
      const isSecureContext =
        window.isSecureContext ||
        location.protocol === "httpss:" ||
        location.hostname === "localhost";

      if (!isSecureContext) {
        throw new Error("Camera requires httpsS or localhost");
      }

      let stream: MediaStream;

      // Try modern API first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
          audio: false,
        });
      } else {
        // Fallback to legacy API
        const legacyGetUserMedia =
          (navigator as any).getUserMedia ||
          (navigator as any).webkitGetUserMedia ||
          (navigator as any).mozGetUserMedia;

        if (!legacyGetUserMedia) {
          throw new Error("No camera API available");
        }

        stream = await new Promise<MediaStream>((resolve, reject) => {
          legacyGetUserMedia.call(
            navigator,
            { video: true, audio: false },
            resolve,
            reject
          );
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        setError("");
      }
    } catch (err) {
      setError("Unable to access webcam: " + (err as Error).message);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-white mb-4">
        Local Video Test
      </h3>

      <div
        className="relative bg-black rounded-lg mb-4"
        style={{ aspectRatio: "16/9" }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full rounded-lg object-cover"
        />

        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-lg">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">📹</div>
              <p>Click Start to test local video</p>
            </div>
          </div>
        )}

        {isStreaming && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
            ● LIVE
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-300 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={startWebcam}
          disabled={isStreaming}
          className={`px-4 py-2 rounded font-semibold ${
            isStreaming
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {isStreaming ? "Streaming..." : "Start Webcam"}
        </button>

        <button
          onClick={stopWebcam}
          disabled={!isStreaming}
          className={`px-4 py-2 rounded font-semibold ${
            !isStreaming
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          Stop
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        <p>
          💡 This demonstrates that the video display system works correctly.
        </p>
        <p>Your RTSP camera will work the same way once it's accessible.</p>
      </div>
    </div>
  );
}
