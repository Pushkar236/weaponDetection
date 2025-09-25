import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the path from the URL
    const url = new URL(request.url);
    const targetPath = url.searchParams.get('path') || '';

    // Your IP Webcam base URL
    const ipWebcamBase = 'http://192.168.137.40:8080';
    const targetUrl = `${ipWebcamBase}${targetPath}`;

    console.log(`Proxying request to: ${targetUrl}`);

    // Forward the request to IP Webcam
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'User-Agent': 'CCTV-Dashboard-Proxy/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`IP Webcam responded with status: ${response.status}`);
    }

    // Get the content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Stream the response
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('IP Webcam proxy error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to connect to IP Webcam', details: errorMessage },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}