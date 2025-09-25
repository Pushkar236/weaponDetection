"use client";

import React, { useState } from "react";

export default function TestRTSP() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const testStreams = [
    {
      name: "New RTSP Server - CAM 1",
      url: "rtsp://192.168.137.106:8554/stream",
      description: "Primary RTSP camera - New server",
    },
    {
      name: "New RTSP Server - CAM 2",
      url: "rtsp://192.168.137.106:8554/stream",
      description: "Secondary RTSP camera - New server",
    },
    {
      name: "New RTSP Server - CAM 3",
      url: "rtsp://192.168.137.106:8554/stream",
      description: "Tertiary RTSP camera - New server",
    },
    {
      name: "Local Webcam",
      url: "webcam://local",
      description: "System webcam camera",
    },
  ];

  const testConnection = async (streamUrl: string, name: string) => {
    try {
      console.log(`🔍 Testing ${name}: ${streamUrl}`);

      // Test server health first
      const healthResponse = await fetch("https://localhost:3002/health");
      if (!healthResponse.ok) {
        throw new Error("RTSP server not running");
      }

      // Test stream conversion
      const response = await fetch(
        `https://localhost:3002/api/start-stream/test_${Date.now()}?rtspUrl=${encodeURIComponent(
          streamUrl
        )}`
      );

      const result = await response.json();

      return {
        name,
        url: streamUrl,
        success: result.success,
        message: result.message || "Stream test completed",
        timestamp: new Date().toLocaleTimeString(),
      };
    } catch (error) {
      return {
        name,
        url: streamUrl,
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  };

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);

    for (const stream of testStreams) {
      const result = await testConnection(stream.url, stream.name);
      setTestResults((prev) => [...prev, result]);

      // Wait 2 seconds between tests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    setTesting(false);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-4">
        RTSP Connection Test
      </h2>

      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={testing}
          className={`px-4 py-2 rounded font-semibold ${
            testing
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {testing ? "Testing..." : "Test RTSP Connections"}
        </button>
      </div>

      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-l-4 ${
              result.success
                ? "bg-green-900/20 border-green-500 text-green-300"
                : "bg-red-900/20 border-red-500 text-red-300"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{result.name}</h3>
                <p className="text-sm opacity-75 font-mono">{result.url}</p>
                <p className="mt-2">{result.message}</p>
              </div>
              <div className="text-right">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    result.success
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {result.success ? "SUCCESS" : "FAILED"}
                </span>
                <p className="text-xs mt-1 opacity-75">{result.timestamp}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {testResults.length > 0 && (
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">
            Test Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {testResults.filter((r) => r.success).length}
              </div>
              <div className="text-sm text-gray-400">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {testResults.filter((r) => !r.success).length}
              </div>
              <div className="text-sm text-gray-400">Failed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
