import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Forward request to Python AI detection server
    const response = await fetch('http://localhost:5000/api/detect-weapons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Detection server responded with status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Log detection results for debugging
    if (result.success && result.detections?.length > 0) {
      console.log(`🎯 AI Detection: Found ${result.detections.length} weapons using ${result.model_used} model`);
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('AI Detection API Error:', error);
    
    // Return appropriate error based on error type
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'Detection timeout - server took too long to respond' },
          { status: 408 }
        );
      }
      
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
        return NextResponse.json(
          { success: false, error: 'AI detection server is not running. Please start the Python server.' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'AI detection service temporarily unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Health check - ping the Python server
    const response = await fetch('http://localhost:5000/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Python server not responding');
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      status: 'healthy',
      python_server: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Python detection server is not running',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}