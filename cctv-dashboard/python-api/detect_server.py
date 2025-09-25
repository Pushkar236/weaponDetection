import torch
import cv2
import numpy as np
from PIL import Image
import base64
import io
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global variables for models
best_model = None
last_model = None

def load_models():
    """Load the trained YOLO models"""
    global best_model, last_model
    
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
        
        # Try to import ultralytics first (more reliable)
        try:
            from ultralytics import YOLO
            logger.info("Using ultralytics YOLO for model loading...")
            
            logger.info("Loading best.pt model...")
            best_model = YOLO(best_model_path)
            logger.info("✅ Best model loaded successfully!")
            
            logger.info("Loading last.pt model...")
            last_model = YOLO(last_model_path)
            logger.info("✅ Last model loaded successfully!")
            
        except ImportError:
            # Fallback to torch.hub method
            logger.info("Ultralytics not available, using torch.hub...")
            import torch
            
            logger.info("Loading best.pt model...")
            best_model = torch.hub.load('ultralytics/yolov5', 'custom', path=best_model_path, trust_repo=True)
            best_model.conf = 0.4
            best_model.iou = 0.45
            
            logger.info("Loading last.pt model...")
            last_model = torch.hub.load('ultralytics/yolov5', 'custom', path=last_model_path, trust_repo=True)
            last_model.conf = 0.4
            last_model.iou = 0.45
        
        logger.info("✅ All models loaded successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
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

def create_annotated_image(image, results):
    """Create an annotated image with detection boxes"""
    try:
        # Convert PIL to numpy array
        img_array = np.array(image)
        
        # Get detection results
        detections = results.pandas().xyxy[0]
        
        # Draw bounding boxes
        for _, detection in detections.iterrows():
            if detection['confidence'] > 0.4:  # Only show confident detections
                # Get coordinates
                x1, y1, x2, y2 = int(detection['xmin']), int(detection['ymin']), int(detection['xmax']), int(detection['ymax'])
                
                # Choose color based on confidence
                confidence = detection['confidence']
                if confidence > 0.8:
                    color = (255, 0, 0)  # Red for high confidence
                elif confidence > 0.6:
                    color = (255, 165, 0)  # Orange for medium confidence
                else:
                    color = (255, 255, 0)  # Yellow for low confidence
                
                # Draw rectangle
                cv2.rectangle(img_array, (x1, y1), (x2, y2), color, 2)
                
                # Add label
                label = f"{detection['name']} {confidence:.2f}"
                label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
                cv2.rectangle(img_array, (x1, y1 - label_size[1] - 10), (x1 + label_size[0], y1), color, -1)
                cv2.putText(img_array, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
        
        # Convert back to PIL
        annotated_image = Image.fromarray(img_array)
        
        # Convert to base64
        buffer = io.BytesIO()
        annotated_image.save(buffer, format='PNG')
        annotated_b64 = base64.b64encode(buffer.getvalue()).decode()
        
        return f'data:image/png;base64,{annotated_b64}'
        
    except Exception as e:
        logger.error(f"Error creating annotated image: {str(e)}")
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    global best_model, last_model
    return jsonify({
        'status': 'healthy',
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
        # Check if models are loaded
        if best_model is None or last_model is None:
            return jsonify({
                'success': False,
                'error': 'Models not loaded. Please restart the server.'
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
        model.conf = confidence_threshold
        
        # Run inference
        results = model(image)
        
        # Process results
        detections = []
        if len(results.pandas().xyxy[0]) > 0:
            for _, detection in results.pandas().xyxy[0].iterrows():
                if detection['confidence'] >= confidence_threshold:
                    detections.append({
                        'class': detection['name'],
                        'confidence': float(detection['confidence']),
                        'bbox': [
                            float(detection['xmin']),
                            float(detection['ymin']),
                            float(detection['xmax']),
                            float(detection['ymax'])
                        ]
                    })
        
        # Create annotated image
        annotated_image = create_annotated_image(image, results)
        
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
            'error': f'Detection failed: {str(e)}'
        }), 500

@app.route('/api/models/info', methods=['GET'])
def get_model_info():
    """Get information about loaded models"""
    global best_model, last_model
    
    try:
        info = {
            'best_model': {
                'loaded': best_model is not None,
                'classes': list(best_model.names.values()) if best_model else [],
                'confidence_threshold': best_model.conf if best_model else None
            },
            'last_model': {
                'loaded': last_model is not None,
                'classes': list(last_model.names.values()) if last_model else [],
                'confidence_threshold': last_model.conf if last_model else None
            }
        }
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Weapon Detection Server...")
    print("📍 Server will run on: http://localhost:5000")
    print("🤖 Loading AI models...")
    
    # Load models on startup
    if load_models():
        print("✅ Models loaded successfully!")
        print("🔍 Detection server ready!")
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        print("❌ Failed to load models. Please check your model files.")
        print("📁 Expected model location: c:\\Users\\pdkir\\OneDrive\\Desktop\\DRDO VIT\\weaponDetection\\cctv-dashboard\\Model\\")