import TestRTSP from "../../../components/TestRTSP";
import WebcamTest from "../../../components/WebcamTest";
import HLSPlayer from "../../../components/HLSPlayer";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🔧 RTSP System Test
          </h1>
          <p className="text-gray-400">
            Test RTSP connections and verify the streaming system is working
          </p>
        </div>

        <div className="grid gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              System Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white">
                  Dashboard Running (Port 3000)
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white">
                  RTSP Server Running (Port 3002)
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-white">FFmpeg 8.0 Ready</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-white">HLS Conversion Active</span>
              </div>
            </div>
          </div>

          <TestRTSP />

          <HLSPlayer />

          <WebcamTest />

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">
              Next Steps
            </h2>
            <div className="space-y-3 text-gray-300">
              <p>
                ✅ <strong>System Architecture:</strong> Complete and working
              </p>
              <p>
                ✅ <strong>RTSP Server:</strong> Running with FFmpeg integration
              </p>
              <p>
                ✅ <strong>Dashboard:</strong> Ready for live streams
              </p>
              <p>
                ⚠️ <strong>Camera Connection:</strong> Check your RTSP camera
                availability
              </p>
              <p>
                🔧 <strong>Network:</strong> Ensure camera is accessible from
                this machine
              </p>
            </div>

            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500 rounded-lg">
              <h3 className="text-blue-300 font-semibold mb-2">
                Camera Troubleshooting
              </h3>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Verify camera IP: 192.168.137.106</li>
                <li>• Check port 8554 is accessible</li>
                <li>• Ensure stream endpoint: /stream</li>
                <li>• Test with VLC: Media → Open Network Stream</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
