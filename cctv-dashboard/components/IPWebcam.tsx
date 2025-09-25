import { useEffect, useRef, useState } from "react";

interface IPWebcamProps {
  cameraId: string;
  ipWebcamUrl: string;
  width?: string;
  height?: string;
}

export default function IPWebcam({
  cameraId,
  ipWebcamUrl,
  width = "100%",
  height = "200px",
}: IPWebcamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<"loading" | "active" | "error">(
    "loading"
  );
  const [error, setError] = useState<string>("");
  const [streamType, setStreamType] = useState<"video" | "mjpeg">("video");
  const [retryCount, setRetryCount] = useState(0);

  // IP Webcam stream URLs (using proxy to avoid CORS/CSP issues)
  const getStreamUrls = (baseUrl: string) => {
    const proxyBase = "/api/ip-webcam";

    return {
      // Main video stream (MP4) via proxy
      video: `${proxyBase}?path=/video`,
      // MJPEG stream (more compatible) via proxy
      mjpeg: `${proxyBase}?path=/shot.jpg`,
      // Live feed via proxy
      feed: `${proxyBase}?path=/videofeed`,
      // Status via proxy
      status: `${proxyBase}?path=/status.json`,
      // Direct URLs for fallback (if proxy fails)
      directVideo: `http://${baseUrl.replace(/^https?:\/\//, "")}/video`,
      directMjpeg: `http://${baseUrl.replace(/^https?:\/\//, "")}/shot.jpg`,
    };
  };

  const streams = getStreamUrls(ipWebcamUrl);

  // Try video stream first, fallback to MJPEG
  useEffect(() => {
    const loadStream = async () => {
      if (!videoRef.current && !imgRef.current) return;

      try {
        setStatus("loading");
        setError("");

        if (streamType === "video") {
          // Try MP4 video stream
          const video = videoRef.current;
          if (video) {
            video.src = streams.video;

            video.onloadstart = () => {
              console.log(`${cameraId}: Video stream loading...`);
            };

            video.onloadeddata = () => {
              console.log(`${cameraId}: Video stream loaded`);
              setStatus("active");
              setRetryCount(0);
            };

            video.onerror = (e) => {
              console.error(`${cameraId}: Video stream error:`, e);
              if (retryCount < 2) {
                // Try MJPEG fallback
                setStreamType("mjpeg");
                setRetryCount((prev) => prev + 1);
              } else {
                setError("Video stream unavailable");
                setStatus("error");
              }
            };

            video.oncanplay = () => {
              video.play().catch((err) => {
                console.error(`${cameraId}: Play error:`, err);
              });
            };
          }
        } else {
          // Use MJPEG stream (refresh image periodically)
          const img = imgRef.current;
          if (img) {
            const refreshImage = () => {
              const timestamp = new Date().getTime();
              img.src = `${streams.mjpeg}&timestamp=${timestamp}`;
            };

            img.onload = () => {
              setStatus("active");
              setError("");
              // Refresh every 100ms for smooth video
              setTimeout(refreshImage, 100);
            };

            img.onerror = () => {
              setError("IP Webcam not accessible");
              setStatus("error");
              // Retry after 5 seconds
              setTimeout(refreshImage, 5000);
            };

            // Start the first load
            refreshImage();
          }
        }
      } catch (err) {
        console.error(`${cameraId}: Stream error:`, err);
        setError(`Connection failed: ${err}`);
        setStatus("error");
      }
    };

    loadStream();
  }, [cameraId, streams.video, streams.mjpeg, streamType, retryCount]);

  // Test IP Webcam connectivity via proxy
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch(streams.status, {
          method: "GET",
        });

        if (response.ok) {
          console.log(`${cameraId}: IP Webcam proxy connection successful`);
        } else {
          console.log(
            `${cameraId}: IP Webcam proxy returned status:`,
            response.status
          );
        }
      } catch (err) {
        console.log(`${cameraId}: IP Webcam proxy test failed:`, err);
      }
    };

    testConnection();
  }, [streams.status, cameraId]);

  const handleStreamTypeToggle = () => {
    setStreamType((prev) => (prev === "video" ? "mjpeg" : "video"));
    setRetryCount(0);
  };

  return (
    <div
      className="relative bg-gray-800 rounded-lg overflow-hidden"
      style={{ width, height }}
    >
      {/* Status Indicator */}
      <div className="absolute top-2 right-2 z-10">
        <div
          className={`w-3 h-3 rounded-full ${
            status === "active"
              ? "bg-green-500 animate-pulse"
              : status === "loading"
              ? "bg-yellow-500 animate-pulse"
              : "bg-red-500"
          }`}
        ></div>
      </div>

      {/* Stream Type Toggle */}
      <div className="absolute top-2 left-2 z-10">
        <button
          onClick={handleStreamTypeToggle}
          className="bg-black/70 text-green-400 text-xs px-2 py-1 rounded border border-green-500 hover:bg-green-500/20"
        >
          {streamType.toUpperCase()}
        </button>
      </div>

      {/* Video Stream */}
      {streamType === "video" && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          controls={false}
          className="w-full h-full object-cover"
          style={{ display: status === "error" ? "none" : "block" }}
        />
      )}

      {/* MJPEG Stream */}
      {streamType === "mjpeg" && (
        <img
          ref={imgRef}
          alt={`${cameraId} stream`}
          className="w-full h-full object-cover"
          style={{ display: status === "error" ? "none" : "block" }}
        />
      )}

      {/* Error Display */}
      {status === "error" && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-400">
            <div className="text-4xl mb-2">📵</div>
            <div className="text-sm">Connection Failed</div>
            <div className="text-xs mt-1">{error}</div>
            <button
              onClick={() => {
                setStatus("loading");
                setRetryCount(0);
              }}
              className="mt-2 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Camera Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <div className="text-green-400 text-xs font-mono">
          <div className="flex justify-between items-center">
            <span>📱 {cameraId}</span>
            <span>
              {status === "active" && "🟢 LIVE"}
              {status === "loading" && "🟡 LOADING"}
              {status === "error" && "🔴 ERROR"}
            </span>
          </div>
          <div className="text-xs text-green-400/70">
            IP Webcam • {streamType.toUpperCase()} •{" "}
            {ipWebcamUrl.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    </div>
  );
}
