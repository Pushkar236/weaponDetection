"use client";

import React from "react";

interface DetectionData {
  id: string;
  weaponType: string;
  confidence: number;
  timestamp: string;
  location: string;
  screenshot: string;
  severity: "low" | "medium" | "high";
}

interface LogsPanelProps {
  detections: DetectionData[];
}

const LogsPanel: React.FC<LogsPanelProps> = ({ detections }) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSeverityColor = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-blue-400";
      default:
        return "text-green-400";
    }
  };

  const getSeverityIcon = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "high":
        return "🚨";
      case "medium":
        return "⚠️";
      case "low":
        return "🟡";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 to-black h-full flex flex-col">
      {/* Enhanced Header */}
      <div className="p-4 border-b-2 border-green-500">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-green-400 text-2xl">📋</div>
          <div>
            <h2 className="text-green-400 font-mono text-xl font-bold">
              DETECTION LOGS
            </h2>
            <p className="text-green-400/70 text-xs font-mono">
              Real-time security alerts
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div className="bg-red-500/20 border border-red-500 rounded p-2 text-center">
            <div className="text-red-400 font-bold">
              {detections.filter((d) => d.severity === "high").length}
            </div>
            <div className="text-red-400/70">HIGH</div>
          </div>
          <div className="bg-yellow-500/20 border border-yellow-500 rounded p-2 text-center">
            <div className="text-yellow-400 font-bold">
              {detections.filter((d) => d.severity === "medium").length}
            </div>
            <div className="text-yellow-400/70">MEDIUM</div>
          </div>
          <div className="bg-blue-500/20 border border-blue-500 rounded p-2 text-center">
            <div className="text-blue-400 font-bold">
              {detections.filter((d) => d.severity === "low").length}
            </div>
            <div className="text-blue-400/70">LOW</div>
          </div>
        </div>
      </div>

      {/* Scrollable Logs Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {detections.length === 0 ? (
          <div className="text-green-400/60 text-center py-12 font-mono text-sm">
            <div className="text-4xl mb-4">🔍</div>
            <div>No detections yet...</div>
            <div className="text-xs text-green-400/40 mt-2">
              System is monitoring
            </div>
          </div>
        ) : (
          detections.map((detection) => (
            <div
              key={detection.id}
              className={`bg-black/60 border-2 rounded-lg p-3 hover:bg-black/80 transition-all duration-200 ${
                detection.severity === "high"
                  ? "border-red-500/50 hover:border-red-500"
                  : detection.severity === "medium"
                  ? "border-yellow-500/50 hover:border-yellow-500"
                  : "border-blue-500/50 hover:border-blue-500"
              }`}
            >
              <div className="flex gap-3">
                {/* Screenshot thumbnail */}
                <div className="flex-shrink-0">
                  {detection.screenshot ? (
                    <div className="relative">
                      <img
                        src={detection.screenshot}
                        alt="Detection screenshot"
                        className="w-16 h-12 object-cover rounded border-2 border-green-500/50"
                      />
                      {/* Severity indicator */}
                      <div
                        className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border border-white ${
                          detection.severity === "high"
                            ? "bg-red-500"
                            : detection.severity === "medium"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        } flex items-center justify-center text-[8px]`}
                      >
                        {getSeverityIcon(detection.severity)}
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-12 bg-gray-800 border-2 border-green-500/50 rounded flex items-center justify-center">
                      <span className="text-green-400/60 text-xs">📷</span>
                    </div>
                  )}
                </div>

                {/* Detection details */}
                <div className="flex-1 font-mono text-xs space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1">
                      <span className={getSeverityColor(detection.severity)}>
                        {getSeverityIcon(detection.severity)}
                      </span>
                      <span
                        className={`font-bold text-sm ${getSeverityColor(
                          detection.severity
                        )}`}
                      >
                        {detection.weaponType}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">
                        {detection.confidence}%
                      </div>
                      <div
                        className={`text-[8px] uppercase font-bold ${getSeverityColor(
                          detection.severity
                        )}`}
                      >
                        {detection.severity}
                      </div>
                    </div>
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
