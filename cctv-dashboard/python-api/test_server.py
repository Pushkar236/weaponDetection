"""
Simple AI Detection Server Test
This will run without external AI packages and provide simulation data
"""
import json
import base64
import io
import time
import random
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

class DetectionHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/health':
            self.send_response(200)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                'status': 'healthy',
                'ai_available': False,
                'models_loaded': {
                    'best_model': False,
                    'last_model': False
                },
                'mode': 'simulation'
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif parsed_path.path == '/api/models/info':
            self.send_response(200)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                'ai_available': False,
                'best_model': {'loaded': False, 'classes': []},
                'last_model': {'loaded': False, 'classes': []},
                'mode': 'simulation'
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/api/detect-weapons':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                # Simulate AI detection processing time
                time.sleep(random.uniform(0.5, 1.5))
                
                # Simulate weapon detection results
                weapons = [
                    "Handgun", "Rifle", "Knife", "Suspicious Object", 
                    "Explosive Device", "Metal Weapon", "Pistol", "AK-47"
                ]
                
                # Random chance of detection
                detection_chance = random.random()
                detections = []
                
                if detection_chance > 0.3:  # 70% chance of detection
                    num_detections = random.randint(1, 2)
                    for i in range(num_detections):
                        weapon_type = random.choice(weapons)
                        confidence = random.uniform(0.5, 0.95)
                        
                        # Random bounding box
                        x1, y1 = random.randint(50, 200), random.randint(50, 200)
                        x2, y2 = x1 + random.randint(50, 150), y1 + random.randint(50, 150)
                        
                        detections.append({
                            'class': weapon_type,
                            'confidence': confidence,
                            'bbox': [x1, y1, x2, y2]
                        })
                
                self.send_response(200)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                response = {
                    'success': True,
                    'detections': detections,
                    'annotated_image': data.get('image'),  # Return original image
                    'model_used': data.get('model', 'simulation'),
                    'total_detections': len(detections),
                    'mode': 'simulation'
                }
                
                print(f"🎯 Simulated detection: Found {len(detections)} weapons")
                
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                print(f"❌ Error in detection: {e}")
                self.send_response(500)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                response = {
                    'success': False,
                    'error': f'Detection failed: {str(e)}',
                    'mode': 'simulation'
                }
                self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def _set_cors_headers(self):
        """Set CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def log_message(self, format, *args):
        """Override to provide custom logging"""
        print(f"🌐 {format % args}")

def start_server():
    """Start the detection server"""
    server_address = ('localhost', 5000)
    httpd = HTTPServer(server_address, DetectionHandler)
    
    print("🚀 Starting Simple AI Detection Server...")
    print("📍 Server running at: http://localhost:5000")
    print("⚠️  Running in simulation mode (no real AI)")
    print("🔍 API endpoints:")
    print("   GET  /health - Health check")
    print("   POST /api/detect-weapons - Weapon detection")
    print("   GET  /api/models/info - Model information")
    print("✅ Server ready!")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        httpd.shutdown()

if __name__ == '__main__':
    start_server()