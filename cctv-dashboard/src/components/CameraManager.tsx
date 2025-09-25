"use client";

import React, { useState, useEffect } from "react";
import { Camera } from "../app/page";

interface CameraManagerProps {
  userCameras: Camera[];
  onAddCamera: (camera: Omit<Camera, 'id'>) => void;
  onRemoveCamera: (cameraId: string) => void;
  onClose: () => void;
}

export default function CameraManager({
  userCameras,
  onAddCamera,
  onRemoveCamera,
  onClose,
}: CameraManagerProps) {
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [cameraName, setCameraName] = useState<string>("");
  const [cameraUrl, setCameraUrl] = useState<string>("");
  const [inputMethod, setInputMethod] = useState<'device' | 'url' | 'rtsp'>('device');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get available camera devices
    const getDevices = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ video: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableDevices(videoDevices);
      } catch (error) {
        console.error('Error accessing camera devices:', error);
      }
    };

    getDevices();
  }, []);

  const handleAddCamera = async () => {
    if (!cameraName.trim()) {
      alert('Please enter a camera name');
      return;
    }

    if (inputMethod === 'device' && !selectedDevice) {
      alert('Please select a camera device');
      return;
    }    if ((inputMethod === 'url' || inputMethod === 'rtsp') && !cameraUrl.trim()) {
      alert('Please enter a camera URL');
      return;
    }

    setLoading(true);

    try {      const newCamera: Omit<Camera, 'id'> = {
        name: cameraName,
        type: 'user',
        inputType: inputMethod === 'device' ? 'webcam' : inputMethod,
        ...(inputMethod === 'device' 
          ? { deviceId: selectedDevice }
          : { url: cameraUrl }
        ),
      };

      onAddCamera(newCamera);
      
      // Reset form
      setCameraName("");
      setSelectedDevice("");
      setCameraUrl("");
    } catch (error) {
      console.error('Error adding camera:', error);
      alert('Failed to add camera');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-800 border-2 border-green-500 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-mono font-bold text-green-400">
            📹 CAMERA MANAGER
          </h2>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-red-400 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Add Camera Section */}
        <div className="mb-8 p-4 bg-gray-900 border border-green-500 rounded">
          <h3 className="text-lg font-mono font-semibold text-green-400 mb-4">
            ADD NEW CAMERA
          </h3>
          
          {/* Camera Name */}
          <div className="mb-4">
            <label className="block text-green-400 font-mono text-sm mb-2">
              Camera Name:
            </label>
            <input
              type="text"
              value={cameraName}
              onChange={(e) => setCameraName(e.target.value)}
              placeholder="e.g., Front Door Camera"
              className="w-full p-2 bg-gray-800 border border-green-500 text-green-400 font-mono rounded focus:outline-none focus:border-green-300"
            />
          </div>

          {/* Input Method Selection */}
          <div className="mb-4">
            <label className="block text-green-400 font-mono text-sm mb-2">
              Camera Source:
            </label>            <div className="flex gap-2 flex-wrap">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="device"
                  checked={inputMethod === 'device'}
                  onChange={(e) => setInputMethod(e.target.value as 'device' | 'url' | 'rtsp')}
                  className="text-green-500"
                />
                <span className="text-green-400 font-mono text-sm">📹 Webcam</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="url"
                  checked={inputMethod === 'url'}
                  onChange={(e) => setInputMethod(e.target.value as 'device' | 'url' | 'rtsp')}
                  className="text-green-500"
                />
                <span className="text-green-400 font-mono text-sm">🌐 HTTP/URL</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="rtsp"
                  checked={inputMethod === 'rtsp'}
                  onChange={(e) => setInputMethod(e.target.value as 'device' | 'url' | 'rtsp')}
                  className="text-green-500"
                />
                <span className="text-green-400 font-mono text-sm">📡 RTSP Stream</span>
              </label>
            </div>
          </div>

          {/* Device Selection */}
          {inputMethod === 'device' && (
            <div className="mb-4">
              <label className="block text-green-400 font-mono text-sm mb-2">
                Select Camera Device:
              </label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-green-500 text-green-400 font-mono rounded focus:outline-none focus:border-green-300"
              >
                <option value="">-- Select a camera --</option>
                {availableDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
                  </option>
                ))}
              </select>
            </div>
          )}          {/* URL Input */}
          {inputMethod === 'url' && (
            <div className="mb-4">
              <label className="block text-green-400 font-mono text-sm mb-2">
                HTTP/URL Stream:
              </label>
              <input
                type="url"
                value={cameraUrl}
                onChange={(e) => setCameraUrl(e.target.value)}
                placeholder="http://example.com/stream.mjpg or http://192.168.1.100:8080/video"
                className="w-full p-2 bg-gray-800 border border-green-500 text-green-400 font-mono rounded focus:outline-none focus:border-green-300"
              />
              <div className="text-green-400/60 font-mono text-xs mt-1">
                Examples: HTTP streams, IP camera URLs, streaming services
              </div>
            </div>
          )}

          {/* RTSP Input */}
          {inputMethod === 'rtsp' && (
            <div className="mb-4">
              <label className="block text-green-400 font-mono text-sm mb-2">
                RTSP Stream URL:
              </label>
              <input
                type="text"
                value={cameraUrl}
                onChange={(e) => setCameraUrl(e.target.value)}
                placeholder="rtsp://username:password@192.168.1.100:554/stream"
                className="w-full p-2 bg-gray-800 border border-green-500 text-green-400 font-mono rounded focus:outline-none focus:border-green-300"
              />
              <div className="text-green-400/60 font-mono text-xs mt-1">
                Real-Time Streaming Protocol for IP cameras and surveillance systems
              </div>
            </div>
          )}

          <button
            onClick={handleAddCamera}
            disabled={loading}
            className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-black font-mono font-semibold rounded transition-colors"
          >
            {loading ? "ADDING..." : "ADD CAMERA"}
          </button>
        </div>

        {/* User Cameras List */}
        <div>
          <h3 className="text-lg font-mono font-semibold text-green-400 mb-4">
            USER CAMERAS ({userCameras.length})
          </h3>
          
          {userCameras.length === 0 ? (
            <p className="text-green-400/70 font-mono text-sm text-center py-4">
              No user cameras added yet
            </p>
          ) : (
            <div className="space-y-2">
              {userCameras.map((camera) => (
                <div
                  key={camera.id}
                  className="flex justify-between items-center p-3 bg-gray-900 border border-green-500 rounded"
                >
                  <div>
                    <div className="text-green-400 font-mono font-semibold">
                      {camera.name}
                    </div>                    <div className="text-green-400/70 font-mono text-xs">
                      {camera.inputType === 'webcam' 
                        ? '📹 Webcam' 
                        : camera.inputType === 'url'
                        ? '🌐 HTTP/URL Stream'
                        : camera.inputType === 'rtsp'
                        ? '📡 RTSP Stream'
                        : 'Dynamic Input'} • ID: {camera.id}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveCamera(camera.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-mono text-sm rounded transition-colors"
                  >
                    REMOVE
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
