import os
import sys
import base64
import io
import traceback
import logging
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Try to import AI packages
try:
    from ultralytics import YOLO
    AI_AVAILABLE = True
    logger.info("✅ AI packages imported successfully")
except ImportError as e:
    AI_AVAILABLE = False
    logger.error(f"❌ AI packages not available: {e}")

# Global variables for models
best_model = None
last_model = None

def load_models():
    """Load the trained YOLO models using ultralytics"""
    global best_model, last_model
    
    if not AI_AVAILABLE:
        logger.error("AI packages not available")
        return False
    
    try:
        # Path to your models
        model_dir = r'c:\Users\pdkir\OneDrive\Desktop\DRDO VIT\weaponDetection\cctv-dashboard\Model'
        best_model_path = os.path.join(model_dir, 'best.pt')
        last_model_path = os.path.join(model_dir, 'last.pt')
        
        logger.info(f"Loading models from: {model_dir}")
        
        # Check if model files exist
        if not os.path.exists(best_model_path):
            raise FileNotFoundError(f"Best model not found: {best_model_path}")
        if not os.path.exists(last_model_path):
            raise FileNotFoundError(f"Last model not found: {last_model_path}")
        
        # Load models using ultralytics YOLO (more reliable than torch.hub)
        logger.info("Loading best.pt model...")
        best_model = YOLO(best_model_path)
        logger.info("✅ Best model loaded successfully!")
        
        logger.info("Loading last.pt model...")
        last_model = YOLO(last_model_path)
        logger.info("✅ Last model loaded successfully!")
        
        logger.info("✅ All models loaded successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error loading models: {str(e)}")
        logger.error(traceback.format_exc())
        return False

def process_image(image_data):
    """Process base64 image data and convert to PIL Image"""
    try:
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        return image
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    global best_model, last_model
    return jsonify({
        'status': 'healthy' if AI_AVAILABLE else 'ai_unavailable',
        'ai_available': AI_AVAILABLE,
        'models_loaded': {
            'best_model': best_model is not None,
            'last_model': last_model is not None
        }
    })

@app.route('/api/detect-weapons', methods=['POST'])
def detect_weapons():
    """Main weapon detection endpoint"""
    global best_model, last_model
    
    try:
        # Check if AI packages are available
        if not AI_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'AI detection packages not installed. Please run: pip install ultralytics torch',
                'fallback': True
            }), 503
        
        # Check if models are loaded
        if best_model is None or last_model is None:
            return jsonify({
                'success': False,
                'error': 'Models not loaded. Please restart the server.',
                'fallback': True
            }), 500
        
        data = request.json
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image data provided'
            }), 400
        
        image_data = data['image']
        model_type = data.get('model', 'best')  # Default to best model
        confidence_threshold = data.get('confidence', 0.4)
        
        logger.info(f"Processing detection request with {model_type} model")
        
        # Process image
        image = process_image(image_data)
        if image is None:
            return jsonify({
                'success': False,
                'error': 'Failed to process image data'
            }), 400
        
        # Select model
        model = best_model if model_type == 'best' else last_model
        
        # Run inference
        results = model(image, conf=confidence_threshold)
        
        # Process results
        detections = []
        if len(results) > 0 and len(results[0].boxes) > 0:
            for box in results[0].boxes:
                confidence = float(box.conf.item())
                if confidence >= confidence_threshold:
                    class_id = int(box.cls.item())
                    class_name = model.names[class_id]
                    bbox = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                    
                    detections.append({
                        'class': class_name,
                        'confidence': confidence,
                        'bbox': bbox
                    })
        
        # Create annotated image
        annotated_image = None
        if len(results) > 0:
            # Get the first result's plot
            annotated_array = results[0].plot()
            annotated_pil = Image.fromarray(annotated_array)
            
            # Convert to base64
            buffer = io.BytesIO()
            annotated_pil.save(buffer, format='PNG')
            annotated_b64 = base64.b64encode(buffer.getvalue()).decode()
            annotated_image = f'data:image/png;base64,{annotated_b64}'
        
        logger.info(f"Detection complete. Found {len(detections)} weapons")
        
        return jsonify({
            'success': True,
            'detections': detections,
            'annotated_image': annotated_image,
            'model_used': model_type,
            'total_detections': len(detections)
        })
        
    except Exception as e:
        logger.error(f"Error in weapon detection: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Detection failed: {str(e)}',
            'fallback': True
        }), 500

@app.route('/api/models/info', methods=['GET'])
def get_model_info():
    """Get information about loaded models"""
    global best_model, last_model
    
    try:
        info = {
            'ai_available': AI_AVAILABLE,
            'best_model': {
                'loaded': best_model is not None,
                'classes': list(best_model.names.values()) if best_model else [],
            },
            'last_model': {
                'loaded': last_model is not None,
                'classes': list(last_model.names.values()) if last_model else [],
            }
        }
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Weapon Detection Server...")
    print("📍 Server will run on: http://localhost:5000")
    
    if not AI_AVAILABLE:
        print("⚠️  AI packages not available - server will run in fallback mode")
        print("📦 To enable AI detection, install packages:")
        print("   pip install ultralytics torch")
    else:
        print("🤖 Loading AI models...")
        if load_models():
            print("✅ Models loaded successfully!")
            print("🔍 AI Detection server ready!")
        else:
            print("⚠️  Failed to load models - server will run in fallback mode")
            print("📁 Expected model location: c:\\Users\\pdkir\\OneDrive\\Desktop\\DRDO VIT\\weaponDetection\\cctv-dashboard\\Model\\")
    
    print("🌐 Starting Flask server...")
    app.run(host='0.0.0.0', port=5000, debug=True)