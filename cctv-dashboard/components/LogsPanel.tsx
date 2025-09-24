"use client";

import React from "react";

interface DetectionData {
  id: string;
  weaponType: string;
  confidence: number;
  timestamp: string;
  location: string;
  screenshot: string;
}

interface LogsPanelProps {
  detections: DetectionData[];
}

const LogsPanel: React.FC<LogsPanelProps> = ({ detections }) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="bg-gray-900 border-l border-green-500 p-4 h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-green-500">
        <div className="text-green-400 text-xl">📋</div>
        <h2 className="text-green-400 font-mono text-lg font-bold">
          DETECTION LOGS
        </h2>
        <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-mono">
          {detections.length}
        </div>
      </div>

      <div className="space-y-3">
        {detections.length === 0 ? (
          <div className="text-green-400/60 text-center py-8 font-mono text-sm">
            No detections yet...
          </div>
        ) : (
          detections.map((detection) => (
            <div
              key={detection.id}
              className="bg-black/50 border border-green-500/30 rounded p-3 hover:border-green-500/60 transition-colors"
            >
              <div className="flex gap-3">
                {/* Screenshot thumbnail */}
                <div className="flex-shrink-0">
                  {detection.screenshot ? (
                    <img
                      src={detection.screenshot}
                      alt="Detection screenshot"
                      className="w-16 h-12 object-cover rounded border border-green-500/50"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-gray-800 border border-green-500/50 rounded flex items-center justify-center">
                      <span className="text-green-400/60 text-xs">📷</span>
                    </div>
                  )}
                </div>

                {/* Detection details */}
                <div className="flex-1 font-mono text-xs space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-red-400 font-bold text-sm">
                      ⚠️ {detection.weaponType}
                    </span>
                    <span className="text-green-400">
                      {detection.confidence}%
                    </span>
                  </div>

                  <div className="text-green-300">📍 {detection.location}</div>

                  <div className="text-green-400/70">
                    🕒 {formatTime(detection.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogsPanel;
