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

// Types for the new optimization API
interface Ingredient {
  name: string;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  calories_per_100g: number;
  quantity_needed: number;
  max_quantity?: number;
}

interface TargetMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface UserPreferences {
  diet_type?: string;
  allergies?: string[];
  preferences?: string[];
}

interface OptimizationRequest {
  ingredients: Ingredient[];
  target_macros: TargetMacros;
  user_preferences?: UserPreferences;
  meal_type?: string;
  request_id?: string;
}

interface OptimizationResponse {
  success: boolean;
  message: string;
  target_achievement: {
    calories: boolean;
    protein: boolean;
    carbs: boolean;
    fat: boolean;
    overall: boolean;
  };
  nutritional_totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  meal: Array<{
    name: string;
    quantity_needed: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
    calories_per_100g: number;
  }>;
  optimization_result: {
    success: boolean;
    method: string;
    computation_time: number;
    objective_value?: number;
    constraints_violated?: string[];
  };
  helper_ingredients_added?: Array<{
    name: string;
    quantity_needed: number;
    reason: string;
  }>;
  request_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Meal Optimization API - POST request received');

    // Parse the request body
    const body: OptimizationRequest = await request.json();
    console.log('📋 Request body:', body);

    // Validate the request
    if (!body.ingredients || !body.target_macros) {
      return addCorsHeaders(
        NextResponse.json(
          { 
            error: 'Missing required fields: ingredients or target_macros',
            status: 'error'
          },
          { status: 400 }
        )
      );
    }

    // Validate ingredients
    for (const ingredient of body.ingredients) {
      if (!ingredient.name || 
          typeof ingredient.protein_per_100g !== 'number' ||
          typeof ingredient.carbs_per_100g !== 'number' ||
          typeof ingredient.fat_per_100g !== 'number' ||
          typeof ingredient.calories_per_100g !== 'number' ||
          typeof ingredient.quantity_needed !== 'number') {
        return addCorsHeaders(
          NextResponse.json(
            { 
              error: 'Invalid ingredient data format',
              details: `Ingredient ${ingredient.name} has invalid data`,
              status: 'error'
            },
            { status: 400 }
          )
        );
      }

      // Set default max_quantity if not provided
      if (!ingredient.max_quantity) {
        ingredient.max_quantity = 500;
      }
    }

    // Validate target macros
    const { target_macros } = body;
    if (target_macros.calories <= 0 || 
        target_macros.protein < 0 || 
        target_macros.carbs < 0 || 
        target_macros.fat < 0) {
      return addCorsHeaders(
        NextResponse.json(
          { 
            error: 'Invalid target macros - all values must be positive',
            receivedTargetMacros: target_macros,
            status: 'error'
          },
          { status: 400 }
        )
      );
    }

    console.log('✅ Request validation passed');
    console.log('🔍 Processing optimization request...');

    // Prepare the request for the external optimization service
    const externalRequest = {
      rag_response: {
        ingredients: body.ingredients.map(ing => ({
          name: ing.name,
          protein_per_100g: ing.protein_per_100g,
          carbs_per_100g: ing.carbs_per_100g,
          fat_per_100g: ing.fat_per_100g,
          calories_per_100g: ing.calories_per_100g,
          quantity_needed: ing.quantity_needed,
          max_quantity: ing.max_quantity || 500
        }))
      },
      target_macros: body.target_macros,
      user_preferences: body.user_preferences || {
        diet_type: 'balanced',
        allergies: [],
        preferences: []
      },
      user_id: 'user_123', // TODO: Get from authentication
      meal_type: body.meal_type || 'Lunch'
    };

    console.log('🔄 Sending request to external optimization service...');
    console.log('📤 External request:', externalRequest);

    // Try multiple endpoints with fallback
    let externalResult: any = null;
    let endpointUsed = '';
    let lastError: string = '';

    const endpoints = [
      MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.OPTIMIZE_SINGLE_MEAL,
      MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.OPTIMIZE_SINGLE_MEAL_SIMPLE,
      MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.OPTIMIZE_SINGLE_MEAL_BASIC
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        endpointUsed = endpoint;

        const externalApiUrl = `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${endpoint}`;
        const externalResponse = await fetch(externalApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AI-Nutrition-App/1.0',
          },
          body: JSON.stringify(externalRequest),
          signal: AbortSignal.timeout(MEAL_OPTIMIZATION_CONFIG.TIMEOUT),
        });

        if (externalResponse.ok) {
          externalResult = await externalResponse.json();
          console.log(`✅ Endpoint ${endpoint} succeeded`);
          break;
        } else {
          const errorText = await externalResponse.text();
          lastError = `Endpoint ${endpoint} failed: ${externalResponse.status} - ${errorText}`;
          console.log(`❌ ${lastError}`);
        }
      } catch (error) {
        lastError = `Endpoint ${endpoint} error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.log(`❌ ${lastError}`);
      }
    }

    if (!externalResult) {
      console.error('❌ All endpoints failed');
      return addCorsHeaders(
        NextResponse.json(
          { 
            error: 'All optimization endpoints failed',
            details: lastError,
            status: 'error'
          },
          { status: 500 }
        )
      );
    }

    console.log('🎯 External optimization result received:', externalResult);
    console.log('🔍 Processing external response...');

    // Transform external API response to our format
    const transformedResult: OptimizationResponse = {
      success: externalResult.success || false,
      message: externalResult.message || 'Optimization completed',
      target_achievement: {
        calories: externalResult.target_achievement?.calories || false,
        protein: externalResult.target_achievement?.protein || false,
        carbs: externalResult.target_achievement?.carbs || false,
        fat: externalResult.target_achievement?.fat || false,
        overall: externalResult.target_achievement?.overall || false,
      },
      nutritional_totals: {
        calories: externalResult.nutritional_totals?.calories || 0,
        protein: externalResult.nutritional_totals?.protein || 0,
        carbs: externalResult.nutritional_totals?.carbs || 0,
        fat: externalResult.nutritional_totals?.fat || 0,
      },
      meal: (externalResult.meal || []).map((item: any) => ({
        name: item.name || 'Unknown Ingredient',
        quantity_needed: item.quantity_needed || 0,
        protein_per_100g: item.protein_per_100g || 0,
        carbs_per_100g: item.carbs_per_100g || 0,
        fat_per_100g: item.fat_per_100g || 0,
        calories_per_100g: item.calories_per_100g || 0,
      })),
      optimization_result: {
        success: externalResult.optimization_result?.success || false,
        method: externalResult.optimization_result?.method || `Unknown (${endpointUsed})`,
        computation_time: externalResult.optimization_result?.computation_time || 0,
        objective_value: externalResult.optimization_result?.objective_value || 0,
        constraints_violated: externalResult.optimization_result?.constraints_violated || [],
      },
      helper_ingredients_added: externalResult.helper_ingredients_added || [],
      request_id: body.request_id || `req_${Date.now()}`,
    };

    console.log('✅ Transformation completed');
    console.log('📊 Final result:', transformedResult);

    // Return the transformed optimization result
    const response = NextResponse.json({
      ...transformedResult,
      status: 'success',
      endpoint_used: endpointUsed,
      optimization_metadata: {
        service_version: '1.0',
        algorithm_precision: '99%+',
        computation_time: transformedResult.optimization_result.computation_time,
        method_used: transformedResult.optimization_result.method
      }
    });

    return addCorsHeaders(response);

  } catch (error) {
    console.error('❌ Meal optimization API error:', error);

    const errorResponse = NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        status: 'error',
        timestamp: new Date().toISOString(),
        request_id: `error_${Date.now()}`
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse);
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Meal Optimization API - GET request received (Health Check)');

    // Test connection to external service
    const healthCheckUrl = `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.HEALTH}`;

    try {
      const healthResponse = await fetch(healthCheckUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AI-Nutrition-App/1.0',
        },
        signal: AbortSignal.timeout(10000), // 10s timeout for health check
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        return addCorsHeaders(
          NextResponse.json({
            message: 'Meal Optimization API is healthy and operational',
            status: 'success',
            external_service: 'connected',
            external_service_health: healthData,
            service_info: {
              name: 'AI Nutrition Meal Optimization API',
              version: '1.0.0',
              endpoints: MEAL_OPTIMIZATION_CONFIG.ENDPOINTS,
              base_url: MEAL_OPTIMIZATION_CONFIG.API_BASE_URL,
              timeout: `${MEAL_OPTIMIZATION_CONFIG.TIMEOUT / 1000}s`
            },
            optimization_capabilities: {
              single_meal: true,
              batch_processing: false,
              real_time: false,
              precision: '99%+',
              algorithms: ['Genetic Algorithm', 'Differential Evolution', 'SciPy Optimization']
            }
          })
        );
      } else {
        return addCorsHeaders(
          NextResponse.json({
            message: 'Meal Optimization API is available but external service has issues',
            status: 'warning',
            external_service: 'error',
            external_service_status: healthResponse.status,
            note: 'External optimization service is not responding properly'
          })
        );
      }
    } catch (externalError) {
      return addCorsHeaders(
        NextResponse.json({
          message: 'Meal Optimization API is available but external service is unreachable',
          status: 'warning',
          external_service: 'unavailable',
          note: 'External optimization service is not accessible',
          error_details: externalError instanceof Error ? externalError.message : 'Unknown error'
        })
      );
    }

  } catch (error) {
    console.error('❌ Meal optimization API GET error:', error);

    const errorResponse = NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        status: 'error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse);
  }
}
