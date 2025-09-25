# CCTV Dashboard - Weapon Detection System

A real-time weapon detection system using CCTV cameras powered by machine learning and computer vision technologies.

## Features

- Real-time video stream monitoring
- AI-powered weapon detection
- Alert system for detected threats
- Dashboard interface for monitoring multiple cameras
- Historical data and analytics
- User authentication and access control

## Technology Stack

- **Frontend**: React.js/Vue.js with responsive design
- **Backend**: Node.js/Python with REST API
- **Machine Learning**: TensorFlow/PyTorch for weapon detection models
- **Database**: MongoDB/PostgreSQL for data storage
- **Real-time Communication**: WebSockets for live updates
- **Video Processing**: OpenCV for computer vision tasks

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB/PostgreSQL
- CUDA-compatible GPU (recommended for AI processing)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cctv-dashboard
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Initialize the database:
```bash
npm run db:migrate
```

## Usage

1. Start the backend server:
```bash
npm run server
```

2. Start the AI detection service:
```bash
python detection_service.py
```

3. Launch the dashboard:
```bash
npm start
```

4. Access the dashboard at `http://localhost:3000`

## Configuration

- Configure camera endpoints in `config/cameras.json`
- Adjust detection sensitivity in `config/detection.json`
- Set up alert notifications in `config/alerts.json`

## API Endpoints

- `GET /api/cameras` - List all cameras
- `POST /api/cameras` - Add new camera
- `GET /api/alerts` - Get alert history
- `WebSocket /ws/live` - Live detection feed

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security Notice

This system is designed for security purposes. Please ensure compliance with local privacy laws and regulations when deploying CCTV monitoring systems.

## Support

For issues and questions, please open an issue on GitHub or contact the development team.