import { NextRequest, NextResponse } from "next/server";
import {
  SingleMealOptimizationRequest,
  SingleMealOptimizationResponse,
  ExternalSingleMealOptimizationResponse,
} from "@/types/meal-optimization";
import { MEAL_OPTIMIZATION_CONFIG } from "@/lib/config/meal-optimization";

// Add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

export async function POST(request: NextRequest) {
  try {
    console.log("Single Meal Optimization API - POST request received");

    // Parse the request body
    const body = await request.json();
    console.log("Request body:", body);

    // Validate the request
    if (!body.rag_response || !body.target_macros || !body.user_preferences) {
      return addCorsHeaders(
        NextResponse.json(
          {
            error:
              "Missing required fields: rag_response, target_macros, or user_preferences",
            status: "error",
          },
          { status: 400 },
        ),
      );
    }

    // Forward the request to the external optimization service using the new /optimize-meal endpoint
    const externalApiUrl = `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.OPTIMIZE_SINGLE_MEAL}`;

    console.log(
      "Forwarding request to external meal optimization service:",
      externalApiUrl,
    );

    // Use the correct RAG format that the external service expects
    const ragRequest = {
      rag_response: {
        ingredients: body.rag_response.suggestions[0].ingredients.map(
          (ing: any) => ({
            name: ing.name,
            protein_per_100g: ing.protein_per_100g,
            carbs_per_100g: ing.carbs_per_100g,
            fat_per_100g: ing.fat_per_100g,
            calories_per_100g: ing.calories_per_100g,
            quantity_needed: ing.quantity_needed || 100,
            max_quantity: 500, // Default max quantity
          }),
        ),
      },
      target_macros: body.target_macros,
      user_preferences: body.user_preferences,
      meal_type: body.meal_type,
    };

    console.log(
      "🔄 Converting request to RAG format for /optimize-meal:",
      ragRequest,
    );

    const externalResponse = await fetch(externalApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ragRequest),
    });

    if (!externalResponse.ok) {
      const errorText = await externalResponse.text();
      console.error(
        "External RAG optimization service error:",
        externalResponse.status,
        errorText,
      );

      return addCorsHeaders(
        NextResponse.json(
          {
            error: `External RAG optimization service error: ${externalResponse.status}`,
            details: errorText,
            status: "error",
          },
          { status: externalResponse.status },
        ),
      );
    }

    // Get the optimization result from external service
    const externalResult: ExternalSingleMealOptimizationResponse =
      await externalResponse.json();

    console.log(
      "RAG optimization result received from external service:",
      externalResult,
    );

    // 🔍 ADDITIONAL DEBUGGING: Log the full response structure
    console.log("🔍 FULL EXTERNAL RESPONSE DEBUG IN API ROUTE:");
    console.log(
      "  - Full externalResult object:",
      JSON.stringify(externalResult, null, 2),
    );
    console.log(
      "  - optimization_result.method:",
      externalResult.optimization_result?.method,
    );
    console.log(
      "  - optimization_result.success:",
      externalResult.optimization_result?.success,
    );
    console.log(
      "  - optimization_result.computation_time:",
      externalResult.optimization_result?.computation_time,
    );
    console.log(
      "  - target_achievement.overall:",
      externalResult.target_achievement?.overall,
    );
    console.log(
      "  - nutritional_totals.calories:",
      externalResult.nutritional_totals?.calories,
    );
    console.log(
      "  - nutritional_totals.protein:",
      externalResult.nutritional_totals?.protein,
    );
    console.log(
      "  - nutritional_totals.carbs:",
      externalResult.nutritional_totals?.carbs,
    );
    console.log(
      "  - nutritional_totals.fat:",
      externalResult.nutritional_totals?.fat,
    );

    // Add detailed logging to debug response structure
    console.log("🔍 Debugging API response structure in route:");
    console.log("  - externalResult.meal:", externalResult.meal);
    console.log("  - externalResult.meal type:", typeof externalResult.meal);
    console.log(
      "  - externalResult.meal length:",
      Array.isArray(externalResult.meal)
        ? externalResult.meal.length
        : "not an array",
    );
    console.log(
      "  - externalResult.nutritional_totals:",
      externalResult.nutritional_totals,
    );
    console.log(
      "  - externalResult.target_achievement:",
      externalResult.target_achievement,
    );

    // 🔍 ADDITIONAL DEBUGGING: Log the full response structure
    console.log("🔍 FULL EXTERNAL RESPONSE DEBUG IN API ROUTE:");
    console.log(
      "  - Full externalResult object:",
      JSON.stringify(externalResult, null, 2),
    );
    console.log(
      "  - optimization_result.method:",
      externalResult.optimization_result?.method,
    );
    console.log(
      "  - optimization_result.success:",
      externalResult.optimization_result?.success,
    );
    console.log(
      "  - optimization_result.computation_time:",
      externalResult.optimization_result?.computation_time,
    );
    console.log(
      "  - target_achievement.overall:",
      externalResult.target_achievement?.overall,
    );
    console.log(
      "  - nutritional_totals.calories:",
      externalResult.nutritional_totals?.calories,
    );
    console.log(
      "  - nutritional_totals.protein:",
      externalResult.nutritional_totals?.protein,
    );
    console.log(
      "  - nutritional_totals.carbs:",
      externalResult.nutritional_totals?.carbs,
    );
    console.log(
      "  - nutritional_totals.fat:",
      externalResult.nutritional_totals?.fat,
    );

    // Validate response structure
    if (!externalResult.meal || !Array.isArray(externalResult.meal)) {
      console.error(
        "❌ Invalid meal structure in API response:",
        externalResult.meal,
      );
      return addCorsHeaders(
        NextResponse.json(
          {
            error: "Invalid meal structure received from optimization API",
            details: "The external API returned an unexpected response format",
            status: "error",
          },
          { status: 500 },
        ),
      );
    }

    // Transform external API response to frontend format
    // Based on actual API response from /optimize-single-meal-rag-advanced
    const transformedResult: SingleMealOptimizationResponse = {
      user_id: externalResult.user_id || "default_user",
      success: externalResult.success || false,
      optimization_result: {
        success: externalResult.optimization_result?.success || false,
        target_achieved: externalResult.target_achievement?.overall || false,
        method: externalResult.optimization_result?.method || "Unknown",
        optimization_method: externalResult.optimization_result?.method || "Unknown",
        computation_time:
          externalResult.optimization_result?.computation_time || 0,
        objective_value: 0, // Not provided by API
        constraints_violated: [], // Not provided by API
      },
      meal: (externalResult.meal || []).map((item) => ({
        name: item.name || "Unknown Ingredient",
        protein_per_100g: item.protein_per_100g || 0,
        carbs_per_100g: item.carbs_per_100g || 0,
        fat_per_100g: item.fat_per_100g || 0,
        calories_per_100g: item.calories_per_100g || 0,
        quantity_needed: item.quantity_needed || 0,
      })),
      nutritional_totals: {
        calories: externalResult.nutritional_totals?.calories || 0,
        protein: externalResult.nutritional_totals?.protein || 0,
        carbs: externalResult.nutritional_totals?.carbs || 0,
        fat: externalResult.nutritional_totals?.fat || 0,
      },
      target_achievement: {
        calories: externalResult.target_achievement?.calories || false,
        protein: externalResult.target_achievement?.protein || false,
        carbs: externalResult.target_achievement?.carbs || false,
        fat: externalResult.target_achievement?.fat || false,
        overall: externalResult.target_achievement?.overall || false,
      },
    };

    console.log("Transformed result for frontend:", transformedResult);

    // Return the transformed optimization result
    const response = NextResponse.json({
      ...transformedResult,
      status: "success",
      message: "RAG meal optimization completed successfully",
    });

    return addCorsHeaders(response);
  } catch (error) {
    console.error("Single meal optimization API error:", error);

    const errorResponse = NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        status: "error",
      },
      { status: 500 },
    );
    return addCorsHeaders(errorResponse);
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("Single Meal Optimization API - GET request received");

    // Test connection to external service
    const externalApiUrl = `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.HEALTH}`;

    try {
      const healthResponse = await fetch(externalApiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        return addCorsHeaders(
          NextResponse.json({
            message: "Single Meal Optimization API endpoint is available",
            status: "success",
            external_service: "connected",
            external_service_health: healthData,
            note: "External RAG optimization service is available and responding",
          }),
        );
      } else {
        return addCorsHeaders(
          NextResponse.json({
            message: "Single Meal Optimization API endpoint is available",
            status: "warning",
            external_service: "error",
            note: "External RAG optimization service is not responding properly",
          }),
        );
      }
    } catch (externalError) {
      return addCorsHeaders(
        NextResponse.json({
          message: "Single Meal Optimization API endpoint is available",
          status: "warning",
          external_service: "unavailable",
          note: "External RAG optimization service is not accessible",
        }),
      );
    }
  } catch (error) {
    console.error("Single meal optimization API GET error:", error);

    const errorResponse = NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        status: "error",
      },
      { status: 500 },
    );
    return addCorsHeaders(errorResponse);
  }
}
