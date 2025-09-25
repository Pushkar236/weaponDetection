import { useEffect, useRef, useState } from "react";

interface MultiWebcamProps {
  cameraId: string;
  width?: string;
  height?: string;
}

export default function MultiWebcam({
  cameraId,
  width = "100%",
  height = "200px",
}: MultiWebcamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"loading" | "active" | "error">(
    "loading"
  );
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Get available cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ video: true });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setDevices(videoDevices);

        if (videoDevices.length > 0 && !selectedDevice) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error getting devices:", err);
        setError("Camera access denied or not available");
        setStatus("error");
      }
    };

    getDevices();
  }, [selectedDevice]);

  // Start camera stream
  useEffect(() => {
    const startCamera = async () => {
      if (!selectedDevice || !videoRef.current) return;

      try {
        setStatus("loading");
        setError("");

        // Stop previous stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        // Get new stream
        const constraints = {
          video: {
            deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setStatus("active");
        };
      } catch (err) {
        console.error("Error starting camera:", err);
        setError(`Camera error: ${err}`);
        setStatus("error");
      }
    };

    startCamera();

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDevice]);

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

  return (
    <div
      className="relative bg-gray-800 rounded-lg overflow-hidden"
      style={{ width, height }}
    >
      {/* Camera Selection Dropdown */}
      {devices.length > 1 && (
        <div className="absolute top-2 left-2 z-10">
          <select
            value={selectedDevice}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="bg-black/70 text-green-400 text-xs px-2 py-1 rounded border border-green-500"
          >
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

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

      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }} // Mirror effect for front camera
      />

      {/* Camera Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <div className="text-green-400 text-xs font-mono">
          <div>📷 {cameraId}</div>
          <div className="flex justify-between items-center">
            <span>
              {status === "active" && "🟢 LIVE"}
              {status === "loading" && "🟡 LOADING"}
              {status === "error" && "🔴 ERROR"}
            </span>
            <span>{devices.length} cameras available</span>
          </div>
          {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
        </div>
      </div>
    </div>
  );
}
