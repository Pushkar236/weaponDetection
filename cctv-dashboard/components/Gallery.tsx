"use client";

import React, { useState } from "react";

interface DetectionData {
  id: string;
  weaponType: string;
  confidence: number;
  timestamp: string;
  location: string;
  screenshot: string;
  severity: "low" | "medium" | "high";
}

interface GalleryPageProps {
  detections: DetectionData[];
  onBack: () => void;
}

const GalleryPage: React.FC<GalleryPageProps> = ({ detections, onBack }) => {
  const [selectedImage, setSelectedImage] = useState<DetectionData | null>(
    null
  );
  const [filterSeverity, setFilterSeverity] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "severity">(
    "newest"
  );

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
        return "text-gray-400";
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

  // Filter and sort detections
  const filteredDetections = detections
    .filter(
      (detection) =>
        filterSeverity === "all" || detection.severity === filterSeverity
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        case "oldest":
          return (
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        case "severity":
          const severityOrder = { high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Header */}
      <div className="bg-black/80 border-b-2 border-gray-400 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="bg-black/90 border border-gray-400 text-gray-300 px-4 py-2 rounded font-mono text-sm hover:bg-gray-500/20 transition-all duration-200"
            >
              ← BACK
            </button>
            <div className="text-gray-300 text-2xl">🖼️</div>
            <div>
              <h1 className="text-gray-300 font-mono text-2xl font-bold">
                DETECTION GALLERY
              </h1>
              <p className="text-gray-500 text-xs font-mono">
                {filteredDetections.length} images • Security Archive
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Filter by Severity */}
            <div className="flex items-center gap-2">
              <label className="text-gray-400">FILTER:</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as any)}
                className="bg-black/60 border border-gray-400 text-gray-300 px-2 py-1 rounded"
              >
                <option value="all">ALL</option>
                <option value="high">HIGH</option>
                <option value="medium">MEDIUM</option>
                <option value="low">LOW</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <label className="text-gray-400">SORT:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-black/60 border border-gray-400 text-gray-300 px-2 py-1 rounded"
              >
                <option value="newest">NEWEST</option>
                <option value="oldest">OLDEST</option>
                <option value="severity">SEVERITY</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="p-6">
        {filteredDetections.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📷</div>
            <div className="text-gray-400 font-mono text-xl mb-2">
              No Images Found
            </div>
            <div className="text-gray-500 font-mono text-sm">
              {detections.length === 0
                ? "No detections have been captured yet"
                : "No images match the current filter"}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredDetections.map((detection) => (
              <div
                key={detection.id}
                className={`relative bg-black/60 border-2 rounded-lg overflow-hidden hover:scale-105 transition-all duration-200 cursor-pointer ${
                  detection.severity === "high"
                    ? "border-red-500/50 hover:border-red-500"
                    : detection.severity === "medium"
                    ? "border-yellow-500/50 hover:border-yellow-500"
                    : "border-blue-500/50 hover:border-blue-500"
                }`}
                onClick={() => setSelectedImage(detection)}
              >
                {/* Image */}
                <div className="aspect-video relative">
                  <img
                    src={detection.screenshot}
                    alt={`Detection: ${detection.weaponType}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Severity Badge */}
                  <div
                    className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-mono font-bold ${
                      detection.severity === "high"
                        ? "bg-red-500/90 text-white"
                        : detection.severity === "medium"
                        ? "bg-yellow-500/90 text-black"
                        : "bg-blue-500/90 text-white"
                    }`}
                  >
                    {getSeverityIcon(detection.severity)}{" "}
                    {detection.severity.toUpperCase()}
                  </div>

                  {/* Confidence Badge */}
                  <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono font-bold">
                    {detection.confidence}%
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 font-mono text-xs">
                  <div
                    className={`font-bold text-sm ${getSeverityColor(
                      detection.severity
                    )} mb-1`}
                  >
                    {detection.weaponType}
                  </div>
                  <div className="text-gray-400 mb-1">
                    📍 {detection.location}
                  </div>
                  <div className="text-gray-500 text-[10px]">
                    {formatTime(detection.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full bg-black border-2 border-gray-400 rounded-lg overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 bg-black/80 border border-red-500 text-red-400 px-3 py-1 rounded font-mono text-sm hover:bg-red-500/20 transition-all duration-200"
            >
              ✕ CLOSE
            </button>

            {/* Image */}
            <div className="flex flex-col md:flex-row">
              <div className="flex-1">
                <img
                  src={selectedImage.screenshot}
                  alt={`Detection: ${selectedImage.weaponType}`}
                  className="w-full h-auto max-h-screen object-contain"
                />
              </div>

              {/* Details Panel */}
              <div className="w-full md:w-80 bg-black/90 p-6 font-mono text-sm space-y-4">
                <div className="border-b border-gray-600 pb-4">
                  <h3 className="text-gray-300 font-bold text-lg mb-2">
                    DETECTION DETAILS
                  </h3>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">
                    WEAPON TYPE:
                  </label>
                  <div
                    className={`font-bold ${getSeverityColor(
                      selectedImage.severity
                    )}`}
                  >
                    {getSeverityIcon(selectedImage.severity)}{" "}
                    {selectedImage.weaponType}
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">
                    CONFIDENCE:
                  </label>
                  <div className="text-white font-bold">
                    {selectedImage.confidence}%
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">SEVERITY:</label>
                  <div
                    className={`font-bold uppercase ${getSeverityColor(
                      selectedImage.severity
                    )}`}
                  >
                    {selectedImage.severity}
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">LOCATION:</label>
                  <div className="text-white">📍 {selectedImage.location}</div>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">TIMESTAMP:</label>
                  <div className="text-white text-xs">
                    {formatTime(selectedImage.timestamp)}
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1">
                    DETECTION ID:
                  </label>
                  <div className="text-gray-300 text-xs font-mono">
                    {selectedImage.id}
                  </div>
                </div>

                {/* Download Button */}
                <button
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = selectedImage.screenshot;
                    link.download = `detection-${selectedImage.id}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full bg-green-600 hover:bg-green-500 border border-green-500 text-white px-4 py-2 rounded font-mono text-sm transition-all duration-200"
                >
                  📥 DOWNLOAD IMAGE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
