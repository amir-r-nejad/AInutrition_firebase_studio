import {
  SingleMealOptimizationRequest,
  SingleMealOptimizationResponse,
  ExternalSingleMealOptimizationResponse,
} from "@/types/meal-optimization";
import { MEAL_OPTIMIZATION_CONFIG } from "@/lib/config/meal-optimization";

export class SingleMealOptimizationService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit,
    retryCount: number = 0,
  ): Promise<T> {
    const maxRetries = 2;
    const baseTimeout = MEAL_OPTIMIZATION_CONFIG.TIMEOUT;
    const timeout = baseTimeout * Math.pow(1.5, retryCount); // Exponential backoff

    console.log(
      `🔄 Attempt ${retryCount + 1}/${maxRetries + 1} with ${timeout / 1000}s timeout`,
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏰ Request timed out after ${timeout / 1000}s`);
      controller.abort();
    }, timeout);

    try {
      // Make direct request to the external optimization service
      const fullUrl = `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${endpoint}`;
      console.log(
        "🌐 Making request to external optimization service:",
        fullUrl,
      );
      console.log("📋 Request details:", {
        url: fullUrl,
        method: options.method,
        timeout: `${timeout / 1000}s`,
        retry: retryCount + 1,
      });

      const response = await fetch(fullUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "AI-Nutrition-App/1.0",
          ...options.headers,
        },
        mode: "cors",
      });

      clearTimeout(timeoutId);
      console.log("✅ Response received:", {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ External service responded with error:", {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl,
          errorText,
        });
        throw new Error(
          `External optimization service failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log(`⏰ Request timed out on attempt ${retryCount + 1}`);

          // Retry with exponential backoff if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s delays
            console.log(`🔄 Retrying in ${delay / 1000}s...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return this.makeRequest(endpoint, options, retryCount + 1);
          }

          throw new Error(
            `Request timed out after ${maxRetries + 1} attempts. The service may be overloaded.`,
          );
        }

        // Log detailed error information for debugging
        console.error("❌ Detailed fetch error:", {
          error: error.message,
          name: error.name,
          stack: error.stack,
          url: `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${endpoint}`,
          config: MEAL_OPTIMIZATION_CONFIG,
          retryCount,
        });

        throw error;
      }

      console.error("❌ External optimization service request error:", error);
      throw new Error(
        "An unexpected error occurred while connecting to the optimization service",
      );
    }
  }

  // Test multiple endpoints to find working ones
  private static async testEndpoint(
    endpoint: string,
  ): Promise<{ working: boolean; status?: number; error?: string }> {
    try {
      console.log(`🔍 Testing endpoint: ${endpoint}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for health checks

      try {
        const response = await fetch(
          `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${endpoint}`,
          {
            method: "GET",
            mode: "cors",
            signal: controller.signal,
            headers: {
              Accept: "application/json",
              "User-Agent": "AI-Nutrition-App/1.0",
            },
          },
        );

        clearTimeout(timeoutId);
        console.log(
          `✅ Endpoint ${endpoint} responded with status: ${response.status}`,
        );

        return { working: response.ok, status: response.status };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.log(`❌ Endpoint ${endpoint} failed:`, error);
      return {
        working: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async optimizeSingleMeal(
    request: SingleMealOptimizationRequest,
  ): Promise<SingleMealOptimizationResponse> {
    try {
      console.log("Connecting to external RAG optimization service...");
      console.log("Service configuration:", MEAL_OPTIMIZATION_CONFIG);

      // 🔍 DEBUG: Log the request being sent
      console.log("🔍 REQUEST DEBUG:");
      console.log("  - Target macros:", request.target_macros);
      console.log("  - User preferences:", request.user_preferences);
      console.log("  - Meal type:", request.meal_type);

      // First test if the service is accessible
      const healthCheck = await this.testEndpoint(
        MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.HEALTH,
      );
      if (!healthCheck.working) {
        throw new Error(
          `Service health check failed. Status: ${healthCheck.status}, Error: ${healthCheck.error}`,
        );
      }

      // Get the optimization result from external service using the new /optimize-meal endpoint
      // Use the correct RAG format that the external service expects
      const ragRequest = {
        rag_response: {
          ingredients: request.rag_response.suggestions[0].ingredients.map(
            (ing) => ({
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
        target_macros: request.target_macros,
        user_preferences: request.user_preferences,
        meal_type: request.meal_type,
      };

      console.log(
        "🔄 Converting request to RAG format for /optimize-meal:",
        ragRequest,
      );

      const externalResult =
        (await this.makeRequest<ExternalSingleMealOptimizationResponse>(
          MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.OPTIMIZE_SINGLE_MEAL,
          {
            method: "POST",
            body: JSON.stringify(ragRequest),
          },
        )) as ExternalSingleMealOptimizationResponse;

      console.log(
        "External RAG optimization service result received:",
        externalResult,
      );

      // Add detailed logging to debug response structure
      console.log("🔍 Debugging API response structure:");
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
      console.log("🔍 FULL EXTERNAL RESPONSE DEBUG:");
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
        throw new Error(
          "Invalid meal structure received from optimization API",
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
      return transformedResult;
    } catch (error) {
      console.error("❌ External RAG optimization service failed:", error);

      // Provide more helpful error messages with suggestions
      let errorMessage = "External RAG optimization service unavailable";
      let suggestion = "";

      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage = `Cannot connect to optimization service at ${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}`;
          suggestion =
            "Please check if the service is running and the URL is correct.";
        } else if (error.message.includes("timed out")) {
          errorMessage = "Request to optimization service timed out";
          suggestion =
            "The service may be overloaded. Try again in a few minutes or use the local optimization option.";
        } else if (error.message.includes("CORS")) {
          errorMessage = "CORS error occurred";
          suggestion = "The service may not allow cross-origin requests.";
        } else if (error.message.includes("Service health check failed")) {
          errorMessage = "Service health check failed";
          suggestion =
            "The service may be down or the endpoint path is incorrect.";
        } else {
          errorMessage = error.message;
          suggestion =
            "Please try again or contact support if the issue persists.";
        }
      }

      const fullMessage = suggestion
        ? `${errorMessage}. ${suggestion}`
        : errorMessage;
      console.log("💡 Error details:", {
        errorMessage,
        suggestion,
        fullMessage,
      });

      // Throw error with helpful message
      throw new Error(fullMessage);
    }
  }

  static async optimizeSingleMealSimple(
    request: SingleMealOptimizationRequest,
  ): Promise<SingleMealOptimizationResponse> {
    try {
      console.log("Connecting to external simple RAG optimization service...");

      // Use the simple RAG optimization endpoint
      const externalResult: ExternalSingleMealOptimizationResponse =
        await this.makeRequest<ExternalSingleMealOptimizationResponse>(
          MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.OPTIMIZE_SINGLE_MEAL_SIMPLE,
          {
            method: "POST",
            body: JSON.stringify(request),
          },
        );

      console.log(
        "External simple RAG optimization service result received:",
        externalResult,
      );

      // Add detailed logging to debug response structure
      console.log("🔍 Debugging API response structure (simple):");
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

      // Validate response structure
      if (!externalResult.meal || !Array.isArray(externalResult.meal)) {
        console.error(
          "❌ Invalid meal structure in API response (simple):",
          externalResult.meal,
        );
        throw new Error(
          "Invalid meal structure received from simple optimization API",
        );
      }

      // Transform external API response to frontend format
      // Based on actual API response from /optimize-single-meal-rag
      const transformedResult: SingleMealOptimizationResponse = {
        user_id: externalResult.user_id || "default_user",
        success: externalResult.success || false,
        optimization_result: {
          success: externalResult.optimization_result?.success || false,
          target_achieved: externalResult.target_achievement?.overall || false,
          method: externalResult.optimization_result?.method || "Unknown",
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

      console.log("Transformed simple result for frontend:", transformedResult);
      return transformedResult;
    } catch (error) {
      console.error("External simple RAG optimization service failed:", error);

      // Provide more helpful error messages
      let errorMessage = "External simple RAG optimization service unavailable";

      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage = `Cannot connect to simple optimization service at ${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}. Please check if the service is running and the URL is correct.`;
        } else if (error.message.includes("timed out")) {
          errorMessage =
            "Request to simple optimization service timed out. The service may be slow or overloaded.";
        } else if (error.message.includes("CORS")) {
          errorMessage =
            "CORS error - the service may not allow cross-origin requests.";
        } else {
          errorMessage = error.message;
        }
      }

      // Throw error instead of falling back to local optimization
      throw new Error(errorMessage);
    }
  }

  static async getRAGIngredients(): Promise<any> {
    try {
      console.log("Fetching RAG ingredients from external service...");

      const result = await this.makeRequest<any>(
        MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.RAG_INGREDIENTS,
        {
          method: "GET",
        },
      );

      console.log("RAG ingredients received:", result);
      return result;
    } catch (error) {
      console.error("Failed to fetch RAG ingredients:", error);
      throw new Error(
        `Failed to fetch RAG ingredients: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  static async getAllIngredients(): Promise<any> {
    try {
      console.log("Fetching all ingredients from external service...");

      const result = await this.makeRequest<any>(
        MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.INGREDIENTS,
        {
          method: "GET",
        },
      );

      console.log("All ingredients received:", result);
      return result;
    } catch (error) {
      console.error("Failed to fetch all ingredients:", error);
      throw new Error(
        `Failed to fetch all ingredients: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Test multiple endpoint paths to find working ones
  static async testMultipleEndpoints(): Promise<{
    working: string[];
    failed: string[];
  }> {
    const endpoints = [
      "/health",
      "/api/health",
      "/",
      "/v1/health",
      "/status",
      "/optimize-single-meal-rag-advanced",
      "/optimize-single-meal-rag",
    ];

    const working: string[] = [];
    const failed: string[] = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`);
        const result = await this.testEndpoint(endpoint);

        if (result.working) {
          working.push(endpoint);
          console.log(
            `✅ Endpoint ${endpoint} is working (Status: ${result.status})`,
          );
        } else {
          failed.push(`${endpoint} (${result.status || result.error})`);
          console.log(
            `❌ Endpoint ${endpoint} failed: ${result.status || result.error}`,
          );
        }
      } catch (error) {
        failed.push(
          `${endpoint} (error: ${error instanceof Error ? error.message : "unknown"})`,
        );
        console.log(`❌ Endpoint ${endpoint} failed with error:`, error);
      }
    }

    return { working, failed };
  }

  static async testConnection(): Promise<{ message: string; status: string }> {
    try {
      console.log(
        "Testing connection to external service at:",
        `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.HEALTH}`,
      );

      // Test connection to the external optimization service with CORS mode
      const response = await fetch(
        `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.HEALTH}`,
        {
          method: "GET",
          mode: "cors",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (response.ok) {
        return {
          message:
            "External RAG optimization service is available and responding",
          status: "success",
        };
      } else {
        return {
          message:
            "External RAG optimization service responded with error status",
          status: "warning",
        };
      }
    } catch (error) {
      console.error("Connection test failed:", error);

      // Provide more specific error messages
      let errorMessage = "External RAG optimization service is not accessible";

      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage =
            "Cannot connect to the service. This might be due to CORS restrictions, network issues, or the service being down.";
        } else if (error.message.includes("CORS")) {
          errorMessage =
            "CORS error - the service does not allow cross-origin requests from this domain.";
        } else {
          errorMessage = `Connection error: ${error.message}`;
        }
      }

      return {
        message: errorMessage,
        status: "error",
      };
    }
  }

  static async getHealth(): Promise<{ status: string; message: string }> {
    try {
      // Check health of the external optimization service
      const response = await fetch(
        `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.HEALTH}`,
        {
          method: "GET",
          mode: "cors",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (response.ok) {
        return {
          status: "success",
          message:
            "External RAG optimization service is healthy and operational",
        };
      } else {
        return {
          status: "warning",
          message: "External RAG optimization service health check failed",
        };
      }
    } catch (error) {
      return {
        status: "error",
        message:
          "External RAG optimization service health check failed - service may be down",
      };
    }
  }
}
