import React, { useState, useEffect } from "react";
import { DetectionData } from "./CCTVFeed";

interface SystemStats {
  totalDetections: number;
  todayDetections: number;
  highSeverityDetections: number;
  activeCameras: number;
  systemUptime: string;
  averageResponseTime: string;
  detectionAccuracy: number;
  lastDetectionTime: string;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  color?: "green" | "yellow" | "red" | "blue";
}

function StatsCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  color = "green",
}: StatsCardProps) {
  const colorClasses = {
    green: "border-green-500 bg-green-500/10 text-green-400",
    yellow: "border-yellow-500 bg-yellow-500/10 text-yellow-400",
    red: "border-red-500 bg-red-500/10 text-red-400",
    blue: "border-blue-500 bg-blue-500/10 text-blue-400",
  };

  const trendIcons = {
    up: "📈",
    down: "📉",
    stable: "➡️",
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="text-sm font-mono opacity-80">{title}</h3>
            <p className="text-2xl font-bold font-mono">{value}</p>
          </div>
        </div>
        {trend && trendValue && (
          <div className="text-right">
            <span className="text-xl">{trendIcons[trend]}</span>
            <p className="text-xs font-mono opacity-70">{trendValue}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatsOverlayProps {
  detections: DetectionData[];
  activeCameras: number;
  isVisible: boolean;
  onClose: () => void;
}

export default function StatsOverlay({
  detections,
  activeCameras,
  isVisible,
  onClose,
}: StatsOverlayProps) {
  const [stats, setStats] = useState<SystemStats>({
    totalDetections: 0,
    todayDetections: 0,
    highSeverityDetections: 0,
    activeCameras: 0,
    systemUptime: "00:00:00",
    averageResponseTime: "0ms",
    detectionAccuracy: 98.5,
    lastDetectionTime: "Never",
  });

  const [startTime] = useState(new Date());

  useEffect(() => {
    const calculateStats = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Calculate uptime
      const uptimeMs = now.getTime() - startTime.getTime();
      const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
      const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((uptimeMs % (1000 * 60)) / 1000);
      const uptime = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      // Calculate detection stats
      const todayDetections = detections.filter(
        (d) => new Date(d.timestamp).getTime() >= today.getTime()
      ).length;

      const highSeverityDetections = detections.filter(
        (d) => d.severity === "high"
      ).length;

      const lastDetection =
        detections.length > 0
          ? new Date(detections[0].timestamp).toLocaleTimeString()
          : "Never";

      // Calculate average response time (simulated)
      const avgResponseTime =
        detections.length > 0
          ? `${Math.floor(Math.random() * 50 + 120)}ms`
          : "0ms";

      setStats({
        totalDetections: detections.length,
        todayDetections,
        highSeverityDetections,
        activeCameras,
        systemUptime: uptime,
        averageResponseTime: avgResponseTime,
        detectionAccuracy: Math.max(95, 100 - detections.length * 0.1),
        lastDetectionTime: lastDetection,
      });
    };

    if (isVisible) {
      calculateStats();
      const interval = setInterval(calculateStats, 1000);
      return () => clearInterval(interval);
    }
  }, [detections, activeCameras, isVisible, startTime]);

  if (!isVisible) return null;

  // Calculate threat level based on recent high severity detections
  const recentHighThreats = detections.filter(
    (d) =>
      d.severity === "high" &&
      new Date().getTime() - new Date(d.timestamp).getTime() < 300000 // 5 minutes
  ).length;

  const threatLevel =
    recentHighThreats >= 3
      ? "CRITICAL"
      : recentHighThreats >= 1
      ? "HIGH"
      : stats.todayDetections > 10
      ? "MEDIUM"
      : "LOW";

  const threatColor =
    threatLevel === "CRITICAL"
      ? "red"
      : threatLevel === "HIGH"
      ? "yellow"
      : threatLevel === "MEDIUM"
      ? "blue"
      : "green";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 border-2 border-green-500 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div>
              <h2 className="text-2xl font-bold font-mono text-green-400">
                SYSTEM STATISTICS
              </h2>
              <p className="text-green-400/70 font-mono">
                Real-time Security Analytics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-mono rounded border border-red-400 transition-colors"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Threat Level Banner */}
        <div
          className={`rounded-lg border-2 p-4 mb-6 ${
            threatColor === "red"
              ? "border-red-500 bg-red-500/20 text-red-400"
              : threatColor === "yellow"
              ? "border-yellow-500 bg-yellow-500/20 text-yellow-400"
              : threatColor === "blue"
              ? "border-blue-500 bg-blue-500/20 text-blue-400"
              : "border-green-500 bg-green-500/20 text-green-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {threatLevel === "CRITICAL"
                  ? "🚨"
                  : threatLevel === "HIGH"
                  ? "⚠️"
                  : threatLevel === "MEDIUM"
                  ? "🟡"
                  : "🟢"}
              </span>
              <div>
                <h3 className="text-xl font-bold font-mono">
                  THREAT LEVEL: {threatLevel}
                </h3>
                <p className="font-mono text-sm opacity-80">
                  {threatLevel === "CRITICAL"
                    ? "Multiple high-severity threats detected"
                    : threatLevel === "HIGH"
                    ? "High-severity threat detected recently"
                    : threatLevel === "MEDIUM"
                    ? "Elevated detection activity"
                    : "System operating normally"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm">Recent High Threats</p>
              <p className="font-mono text-2xl font-bold">
                {recentHighThreats}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="TOTAL DETECTIONS"
            value={stats.totalDetections}
            icon="🎯"
            trend="up"
            trendValue="+12%"
            color="blue"
          />
          <StatsCard
            title="TODAY'S DETECTIONS"
            value={stats.todayDetections}
            icon="📅"
            trend="stable"
            trendValue="Normal"
            color="green"
          />
          <StatsCard
            title="HIGH SEVERITY"
            value={stats.highSeverityDetections}
            icon="⚠️"
            trend={stats.highSeverityDetections > 0 ? "up" : "stable"}
            trendValue={stats.highSeverityDetections > 0 ? "Alert" : "Safe"}
            color={stats.highSeverityDetections > 0 ? "red" : "green"}
          />
          <StatsCard
            title="ACTIVE CAMERAS"
            value={`${stats.activeCameras}/4`}
            icon="📹"
            trend="stable"
            trendValue="Online"
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="SYSTEM UPTIME"
            value={stats.systemUptime}
            icon="⏱️"
            color="green"
          />
          <StatsCard
            title="RESPONSE TIME"
            value={stats.averageResponseTime}
            icon="⚡"
            trend="down"
            trendValue="Optimized"
            color="green"
          />
          <StatsCard
            title="ACCURACY"
            value={`${stats.detectionAccuracy.toFixed(1)}%`}
            icon="🎯"
            trend="up"
            trendValue="Excellent"
            color="green"
          />
          <StatsCard
            title="LAST DETECTION"
            value={stats.lastDetectionTime}
            icon="🕐"
            color="blue"
          />
        </div>

        {/* Detection Timeline */}
        <div className="border-2 border-green-500 rounded-lg bg-green-500/10 p-4 mb-6">
          <h3 className="text-lg font-bold font-mono text-green-400 mb-3">
            📈 DETECTION TIMELINE (LAST 24H)
          </h3>
          <div className="grid grid-cols-12 gap-1 h-20">
            {Array.from({ length: 24 }, (_, i) => {
              const hourDetections = detections.filter((d) => {
                const detectionHour = new Date(d.timestamp).getHours();
                const currentHour = new Date().getHours();
                const targetHour = (currentHour - (23 - i) + 24) % 24;
                return detectionHour === targetHour;
              }).length;

              const height = Math.min(
                100,
                (hourDetections /
                  Math.max(
                    1,
                    Math.max(
                      ...Array.from({ length: 24 }, (_, j) => {
                        const hour =
                          (new Date().getHours() - (23 - j) + 24) % 24;
                        return detections.filter(
                          (d) => new Date(d.timestamp).getHours() === hour
                        ).length;
                      })
                    )
                  )) *
                  100
              );

              return (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-full bg-green-500 rounded-sm"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-green-400/70 mt-1">
                    {String(
                      (new Date().getHours() - (23 - i) + 24) % 24
                    ).padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detection Types Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-green-500 rounded-lg bg-green-500/10 p-4">
            <h3 className="text-lg font-bold font-mono text-green-400 mb-3">
              🔫 WEAPON TYPES DETECTED
            </h3>
            <div className="space-y-2">
              {["Handgun", "Knife", "Rifle", "Other"].map((weapon, index) => {
                const count = detections.filter((d) =>
                  d.weaponType.toLowerCase().includes(weapon.toLowerCase())
                ).length;
                const percentage =
                  detections.length > 0 ? (count / detections.length) * 100 : 0;

                return (
                  <div
                    key={weapon}
                    className="flex items-center justify-between"
                  >
                    <span className="font-mono text-sm text-green-400">
                      {weapon}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-700 rounded">
                        <div
                          className="h-full bg-green-500 rounded"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm text-green-400 w-8">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-2 border-green-500 rounded-lg bg-green-500/10 p-4">
            <h3 className="text-lg font-bold font-mono text-green-400 mb-3">
              🏢 DETECTION BY LOCATION
            </h3>
            <div className="space-y-2">
              {[
                "Building A - Main Entrance",
                "Building B - Parking Lot",
                "Perimeter - North Gate",
                "Reception Area - Lobby",
              ].map((location, index) => {
                const count = detections.filter(
                  (d) => d.location === location
                ).length;
                const percentage =
                  detections.length > 0 ? (count / detections.length) * 100 : 0;

                return (
                  <div
                    key={location}
                    className="flex items-center justify-between"
                  >
                    <span className="font-mono text-xs text-green-400">
                      {location}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-700 rounded">
                        <div
                          className="h-full bg-green-500 rounded"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-green-400 w-6">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
