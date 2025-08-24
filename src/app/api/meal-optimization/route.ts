import { NextRequest, NextResponse } from 'next/server';
import { MEAL_OPTIMIZATION_CONFIG } from '@/lib/config/meal-optimization';

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
    const body = await request.json();
    const { endpoint, data } = body;

    console.log('Meal Optimization API Proxy - POST:', { endpoint, data: data ? 'data present' : 'no data' });

    if (!endpoint) {
      const errorResponse = NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse);
    }

    const fullUrl = `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${endpoint}`;
    console.log('Making request to:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('External API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error:', { status: response.status, statusText: response.statusText, error: errorText });
      
      const errorResponse = NextResponse.json(
        { error: `API request failed: ${response.status} ${response.statusText} - ${errorText}` },
        { status: response.status }
      );
      return addCorsHeaders(errorResponse);
    }

    const result = await response.json();
    console.log('External API success, returning result');
    
    const successResponse = NextResponse.json(result);
    return addCorsHeaders(successResponse);
  } catch (error) {
    console.error('Meal optimization API proxy error:', error);
    
    const errorResponse = NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    console.log('Meal Optimization API Proxy - GET:', { endpoint });

    if (!endpoint) {
      const errorResponse = NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
      return addCorsHeaders(errorResponse);
    }

    const fullUrl = `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${endpoint}`;
    console.log('Making GET request to:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('External API GET response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API GET error:', { status: response.status, statusText: response.statusText, error: errorText });
      
      const errorResponse = NextResponse.json(
        { error: `API request failed: ${response.status} ${response.statusText} - ${errorText}` },
        { status: response.status }
      );
      return addCorsHeaders(errorResponse);
    }

    const result = await response.json();
    console.log('External API GET success, returning result');
    
    const successResponse = NextResponse.json(result);
    return addCorsHeaders(successResponse);
  } catch (error) {
    console.error('Meal optimization API proxy GET error:', error);
    
    const errorResponse = NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse);
  }
}
