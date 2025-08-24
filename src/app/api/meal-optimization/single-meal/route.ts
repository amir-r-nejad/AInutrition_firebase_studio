import { NextRequest, NextResponse } from 'next/server';

// Add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function POST(request: NextRequest) {
  try {
    console.log('Single Meal Optimization API - POST request received');
    
    // For now, just return a success response indicating the endpoint is available
    // The actual optimization will be handled by the service's mock response
    const response = NextResponse.json({
      message: 'Single Meal Optimization API endpoint is available',
      status: 'success',
      note: 'This endpoint is ready for backend implementation. Currently using mock responses for testing.'
    });
    
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Single meal optimization API error:', error);
    
    const errorResponse = NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse);
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Single Meal Optimization API - GET request received');
    
    const response = NextResponse.json({
      message: 'Single Meal Optimization API endpoint is available',
      status: 'success',
      note: 'This endpoint is ready for backend implementation. Currently using mock responses for testing.'
    });
    
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Single meal optimization API GET error:', error);
    
    const errorResponse = NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse);
  }
}
