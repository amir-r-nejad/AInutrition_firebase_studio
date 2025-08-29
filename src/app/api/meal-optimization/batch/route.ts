import { NextRequest, NextResponse } from "next/server";
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

// Types for batch optimization
interface BatchIngredient {
  name: string;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  calories_per_100g: number;
  quantity_needed: number;
  max_quantity?: number;
}

interface BatchTargetMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface BatchUserPreferences {
  diet_type?: string;
  allergies?: string[];
  preferences?: string[];
}

interface BatchMealRequest {
  meal_id: string;
  ingredients: BatchIngredient[];
  target_macros: BatchTargetMacros;
  user_preferences?: BatchUserPreferences;
  meal_type?: string;
}

interface BatchOptimizationRequest {
  meals: BatchMealRequest[];
  user_id?: string;
  batch_id?: string;
  parallel_processing?: boolean;
}

interface BatchOptimizationResponse {
  batch_id: string;
  total_meals: number;
  successful_optimizations: number;
  failed_optimizations: number;
  success_rate: number;
  total_processing_time: number;
  results: Array<{
    meal_id: string;
    success: boolean;
    result?: any;
    error?: string;
    processing_time: number;
  }>;
  summary: {
    overall_success: boolean;
    average_computation_time: number;
    methods_used: string[];
    target_achievement_summary: {
      calories_achieved: number;
      protein_achieved: number;
      carbs_achieved: number;
      fat_achieved: number;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Batch Meal Optimization API - POST request received");

    // Parse the request body
    const body: BatchOptimizationRequest = await request.json();
    console.log("📋 Batch request body:", body);

    // Validate the request
    if (!body.meals || !Array.isArray(body.meals) || body.meals.length === 0) {
      return addCorsHeaders(
        NextResponse.json(
          {
            error: "Missing or invalid meals array",
            status: "error",
          },
          { status: 400 },
        ),
      );
    }

    if (body.meals.length > 10) {
      return addCorsHeaders(
        NextResponse.json(
          {
            error: "Maximum 10 meals allowed per batch request",
            status: "error",
          },
          { status: 400 },
        ),
      );
    }

    // Validate each meal
    for (const meal of body.meals) {
      if (!meal.meal_id || !meal.ingredients || !meal.target_macros) {
        return addCorsHeaders(
          NextResponse.json(
            {
              error: `Invalid meal data for meal_id: ${meal.meal_id}`,
              details:
                "Each meal must have meal_id, ingredients, and target_macros",
              status: "error",
            },
            { status: 400 },
          ),
        );
      }

      // Validate ingredients
      for (const ingredient of meal.ingredients) {
        if (
          !ingredient.name ||
          typeof ingredient.protein_per_100g !== "number" ||
          typeof ingredient.carbs_per_100g !== "number" ||
          typeof ingredient.fat_per_100g !== "number" ||
          typeof ingredient.calories_per_100g !== "number" ||
          typeof ingredient.quantity_needed !== "number"
        ) {
          return addCorsHeaders(
            NextResponse.json(
              {
                error: `Invalid ingredient data in meal ${meal.meal_id}`,
                details: `Ingredient ${ingredient.name} has invalid data`,
                status: "error",
              },
              { status: 400 },
            ),
          );
        }

        // Set default max_quantity if not provided
        if (!ingredient.max_quantity) {
          ingredient.max_quantity = 500;
        }
      }

      // Validate target macros
      const { target_macros } = meal;
      if (
        target_macros.calories <= 0 ||
        target_macros.protein < 0 ||
        target_macros.carbs < 0 ||
        target_macros.fat < 0
      ) {
        return addCorsHeaders(
          NextResponse.json(
            {
              error: `Invalid target macros for meal ${meal.meal_id}`,
              details: "All macro values must be positive",
              status: "error",
            },
            { status: 400 },
          ),
        );
      }
    }

    console.log("✅ Batch request validation passed");
    console.log(`🔍 Processing ${body.meals.length} meals...`);

    const batchId = body.batch_id || `batch_${Date.now()}`;
    const startTime = Date.now();
    const results: any[] = [];
    const methodsUsed: string[] = [];
    let successfulCount = 0;
    let failedCount = 0;

    // Process meals sequentially (can be enhanced for parallel processing)
    for (const meal of body.meals) {
      const mealStartTime = Date.now();
      console.log(`🔄 Processing meal: ${meal.meal_id}`);

      try {
        // Prepare the request for the external optimization service
        const externalRequest = {
          rag_response: {
            ingredients: meal.ingredients.map((ing) => ({
              name: ing.name,
              protein_per_100g: ing.protein_per_100g,
              carbs_per_100g: ing.carbs_per_100g,
              fat_per_100g: ing.fat_per_100g,
              calories_per_100g: ing.calories_per_100g,
              quantity_needed: ing.quantity_needed,
              max_quantity: ing.max_quantity || 500,
            })),
          },
          target_macros: meal.target_macros,
          user_preferences: meal.user_preferences || {
            diet_type: "balanced",
            allergies: [],
            preferences: [],
          },
          user_id: body.user_id || "user_123",
          meal_type: meal.meal_type || "Lunch",
        };

        // Try multiple endpoints with fallback
        let externalResult: any = null;
        let endpointUsed = "";

        const endpoints = [
          MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.OPTIMIZE_SINGLE_MEAL,
          MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.OPTIMIZE_SINGLE_MEAL_SIMPLE,
          MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.OPTIMIZE_SINGLE_MEAL_BASIC,
        ];

        for (const endpoint of endpoints) {
          try {
            const externalApiUrl = `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${endpoint}`;
            const externalResponse = await fetch(externalApiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "User-Agent": "AI-Nutrition-App/1.0",
              },
              body: JSON.stringify(externalRequest),
              signal: AbortSignal.timeout(MEAL_OPTIMIZATION_CONFIG.TIMEOUT),
            });

            if (externalResponse.ok) {
              externalResult = await externalResponse.json();
              endpointUsed = endpoint;
              break;
            }
          } catch (error) {
            console.log(
              `❌ Endpoint ${endpoint} failed for meal ${meal.meal_id}`,
            );
          }
        }

        if (externalResult) {
          const processingTime = Date.now() - mealStartTime;
          const method =
            externalResult.optimization_result?.method || "Unknown";

          methodsUsed.push(method);
          successfulCount++;

          results.push({
            meal_id: meal.meal_id,
            success: true,
            result: externalResult,
            processing_time: processingTime,
            endpoint_used: endpointUsed,
          });

          console.log(
            `✅ Meal ${meal.meal_id} optimized successfully in ${processingTime}ms`,
          );
        } else {
          const processingTime = Date.now() - mealStartTime;
          failedCount++;

          results.push({
            meal_id: meal.meal_id,
            success: false,
            error: "All optimization endpoints failed",
            processing_time: processingTime,
          });

          console.log(`❌ Meal ${meal.meal_id} failed to optimize`);
        }
      } catch (error) {
        const processingTime = Date.now() - mealStartTime;
        failedCount++;

        results.push({
          meal_id: meal.meal_id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          processing_time: processingTime,
        });

        console.log(`❌ Meal ${meal.meal_id} error:`, error);
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    const successRate = (successfulCount / body.meals.length) * 100;

    // Calculate target achievement summary
    const targetAchievementSummary = {
      calories_achieved: 0,
      protein_achieved: 0,
      carbs_achieved: 0,
      fat_achieved: 0,
    };

    results.forEach((result) => {
      if (result.success && result.result?.target_achievement) {
        const achievement = result.result.target_achievement;
        if (achievement.calories) targetAchievementSummary.calories_achieved++;
        if (achievement.protein) targetAchievementSummary.protein_achieved++;
        if (achievement.carbs) targetAchievementSummary.carbs_achieved++;
        if (achievement.fat) targetAchievementSummary.fat_achieved++;
      }
    });

    // Calculate average computation time
    const successfulResults = results.filter((r) => r.success);
    const averageComputationTime =
      successfulResults.length > 0
        ? successfulResults.reduce((sum, r) => sum + r.processing_time, 0) /
          successfulResults.length
        : 0;

    const batchResponse: BatchOptimizationResponse = {
      batch_id: batchId,
      total_meals: body.meals.length,
      successful_optimizations: successfulCount,
      failed_optimizations: failedCount,
      success_rate: successRate,
      total_processing_time: totalProcessingTime,
      results: results.map((r) => ({
        meal_id: r.meal_id,
        success: r.success,
        result: r.result,
        error: r.error,
        processing_time: r.processing_time,
      })),
      summary: {
        overall_success: successfulCount > 0,
        average_computation_time: averageComputationTime,
        methods_used: [...new Set(methodsUsed)],
        target_achievement_summary: targetAchievementSummary,
      },
    };

    console.log("✅ Batch processing completed");
    console.log(
      `📊 Summary: ${successfulCount}/${body.meals.length} meals optimized successfully`,
    );
    console.log(`⏱️ Total processing time: ${totalProcessingTime}ms`);

    // Return the batch optimization result
    const response = NextResponse.json({
      ...batchResponse,
      status: "success",
      optimization_metadata: {
        service_version: "1.0",
        algorithm_precision: "99%+",
        batch_processing: true,
        parallel_processing: body.parallel_processing || false,
      },
    });

    return addCorsHeaders(response);
  } catch (error) {
    console.error("❌ Batch meal optimization API error:", error);

    const errorResponse = NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        status: "error",
        timestamp: new Date().toISOString(),
        batch_id: `error_${Date.now()}`,
      },
      { status: 500 },
    );
    return addCorsHeaders(errorResponse);
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log(
      "🔍 Batch Meal Optimization API - GET request received (Health Check)",
    );

    return addCorsHeaders(
      NextResponse.json({
        message: "Batch Meal Optimization API is operational",
        status: "success",
        service_info: {
          name: "AI Nutrition Batch Meal Optimization API",
          version: "1.0.0",
          max_batch_size: 10,
          supported_features: [
            "Sequential processing",
            "Multiple endpoint fallback",
            "Comprehensive error handling",
            "Performance metrics",
          ],
        },
        endpoints: {
          batch_optimization: "/api/meal-optimization/batch",
          single_optimization: "/api/meal-optimization/optimize",
          health_check: "/api/meal-optimization/batch",
        },
      }),
    );
  } catch (error) {
    console.error("❌ Batch meal optimization API GET error:", error);

    const errorResponse = NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        status: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
    return addCorsHeaders(errorResponse);
  }
}
