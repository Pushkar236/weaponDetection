"use client";

import React from "react";

interface ToastProps {
  detection: {
    weaponType: string;
    confidence: number;
    timestamp: string;
    location: string;
  };
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ detection, onClose }) => {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-900 border-2 border-red-500 text-red-100 p-4 rounded-lg shadow-lg shadow-red-500/50 font-mono animate-pulse max-w-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="text-xl">🚨 WEAPON DETECTED</div>
        <button
          onClick={onClose}
          className="text-red-300 hover:text-red-100 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="space-y-1 text-sm">
        <div>
          <span className="text-red-300">TYPE:</span> {detection.weaponType}
        </div>
        <div>
          <span className="text-red-300">CONFIDENCE:</span>{" "}
          {detection.confidence}%
        </div>
        <div>
          <span className="text-red-300">TIME:</span>{" "}
          {formatTime(detection.timestamp)}
        </div>
        <div>
          <span className="text-red-300">LOCATION:</span> {detection.location}
        </div>
      </div>
    </div>
  );
};

export default Toast;
