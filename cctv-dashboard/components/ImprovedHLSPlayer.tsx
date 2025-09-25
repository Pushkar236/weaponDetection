import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface ImprovedHLSPlayerProps {
  streamId: string;
  rtspUrl: string;
  width?: string;
  height?: string;
}

export default function ImprovedHLSPlayer({
  streamId,
  rtspUrl,
  width = "100%",
  height = "200px",
}: ImprovedHLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<
    "loading" | "playing" | "error" | "stopped"
  >("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const startStream = async () => {
      try {
        setStatus("loading");
        setError("");

        // Start RTSP to HLS conversion
        const response = await fetch(
          `https://localhost:3002/api/start-stream/${streamId}?rtspUrl=${encodeURIComponent(
            rtspUrl
          )}`
        );

        if (!response.ok) {
          throw new Error(`Failed to start stream: ${response.statusText}`);
        }

        // Wait for HLS stream to be available
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Initialize HLS player
        const hlsUrl = `https://localhost:3002/api/stream/${streamId}.m3u8`;

        if (videoRef.current) {
          if (Hls.isSupported()) {
            const hls = new Hls({
              manifestLoadingTimeOut: 10000,
              manifestLoadingMaxRetry: 3,
              levelLoadingTimeOut: 10000,
              levelLoadingMaxRetry: 3,
              fragLoadingTimeOut: 10000,
              fragLoadingMaxRetry: 3,
              liveSyncDurationCount: 2,
              liveMaxLatencyDurationCount: 5,
            });

            hlsRef.current = hls;
            hls.loadSource(hlsUrl);
            hls.attachMedia(videoRef.current);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setStatus("playing");
              videoRef.current?.play().catch(console.warn);
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
              console.error("HLS Error:", data);
              if (data.fatal) {
                setStatus("error");
                setError(`HLS Error: ${data.details}`);
              }
            });
          } else if (
            videoRef.current.canPlayType("application/vnd.apple.mpegurl")
          ) {
            // Native HLS support (Safari)
            videoRef.current.src = hlsUrl;
            videoRef.current.addEventListener("loadedmetadata", () => {
              setStatus("playing");
              videoRef.current?.play().catch(console.warn);
            });
          } else {
            throw new Error("HLS is not supported in this browser");
          }
        }
      } catch (err) {
        console.error("Stream error:", err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      }
    };

    startStream();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamId, rtspUrl]);

  const stopStream = async () => {
    try {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      await fetch(`https://localhost:3002/api/stop-stream/${streamId}`, {
        method: "POST",
      });

      setStatus("stopped");
    } catch (err) {
      console.error("Stop stream error:", err);
    }
  };

  const restartStream = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    // Re-trigger useEffect
    setStatus("loading");
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="relative" style={{ width, height }}>
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p>Starting stream...</p>
              <p className="text-xs text-gray-400 mt-1">
                Stream ID: {streamId}
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
            <div className="text-center text-white p-4">
              <p className="text-red-300 mb-2">⚠️ Stream Error</p>
              <p className="text-xs text-red-200 mb-3">{error}</p>
              <button
                onClick={restartStream}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ display: status === "playing" ? "block" : "none" }}
          muted
          autoPlay
          playsInline
        />

        {status === "playing" && (
          <div className="absolute top-2 right-2">
            <button
              onClick={stopStream}
              className="px-3 py-1 bg-red-600/80 hover:bg-red-700 text-white text-xs rounded-md"
            >
              Stop
            </button>
          </div>
        )}
      </div>

      <div className="p-2 bg-gray-800">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">
            Status:
            <span
              className={`ml-1 ${
                status === "playing"
                  ? "text-green-400"
                  : status === "error"
                  ? "text-red-400"
                  : status === "loading"
                  ? "text-yellow-400"
                  : "text-gray-400"
              }`}
            >
              {status.toUpperCase()}
            </span>
          </span>
          <span className="text-xs text-gray-500">{streamId}</span>
        </div>
      </div>
    </div>
  );
}
