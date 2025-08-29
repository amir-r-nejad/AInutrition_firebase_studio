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

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 Test endpoint - Testing external service connection");

    const testResults = {
      config: MEAL_OPTIMIZATION_CONFIG,
      health_check: null as any,
      endpoints_test: {} as any,
    };

    // Test health endpoint
    try {
      const healthUrl = `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${MEAL_OPTIMIZATION_CONFIG.ENDPOINTS.HEALTH}`;
      console.log(`🔍 Testing health endpoint: ${healthUrl}`);

      const healthResponse = await fetch(healthUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "AI-Nutrition-App/1.0",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        testResults.health_check = {
          status: "success",
          status_code: healthResponse.status,
          data: healthData,
        };
        console.log("✅ Health check successful");
      } else {
        testResults.health_check = {
          status: "failed",
          status_code: healthResponse.status,
          error: await healthResponse.text(),
        };
        console.log("❌ Health check failed");
      }
    } catch (error) {
      testResults.health_check = {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
      console.log("❌ Health check error:", error);
    }

    // Test optimization endpoints
    const endpointsToTest = [
      "OPTIMIZE_SINGLE_MEAL",
      "OPTIMIZE_SINGLE_MEAL_ADVANCED",
      "OPTIMIZE_SINGLE_MEAL_SIMPLE",
      "OPTIMIZE_SINGLE_MEAL_BASIC",
    ];

    for (const endpointKey of endpointsToTest) {
      const endpoint =
        MEAL_OPTIMIZATION_CONFIG.ENDPOINTS[
          endpointKey as keyof typeof MEAL_OPTIMIZATION_CONFIG.ENDPOINTS
        ];
      if (endpoint) {
        try {
          const testUrl = `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${endpoint}`;
          console.log(`🔍 Testing endpoint ${endpointKey}: ${testUrl}`);

          // Test with POST method for /optimize-meal endpoint
          if (endpoint === "/optimize-meal") {
            console.log(`🧪 Testing POST method for ${endpointKey}`);

            const postResponse = await fetch(testUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "User-Agent": "AI-Nutrition-App/1.0",
              },
              body: JSON.stringify({
                rag_response: {
                  suggestions: [
                    {
                      ingredients: [
                        {
                          name: "Test Ingredient",
                          protein_per_100g: 20,
                          carbs_per_100g: 10,
                          fat_per_100g: 5,
                          calories_per_100g: 150,
                          quantity_needed: 100,
                        },
                      ],
                    },
                  ],
                  success: true,
                  message: "Test data",
                },
                target_macros: {
                  calories: 500,
                  protein: 30,
                  carbs: 50,
                  fat: 20,
                },
                user_preferences: {
                  diet_type: "balanced",
                  allergies: [],
                  preferences: [],
                },
                user_id: "test_user",
                meal_type: "test",
              }),
              signal: AbortSignal.timeout(10000),
            });

            testResults.endpoints_test[endpointKey] = {
              endpoint,
              url: testUrl,
              status_code: postResponse.status,
              status_text: postResponse.statusText,
              exists: true,
              method_allowed: postResponse.status !== 404,
              post_test: {
                status: postResponse.status,
                working: postResponse.ok,
                response: postResponse.ok
                  ? await postResponse.json()
                  : await postResponse.text(),
              },
            };

            console.log(
              `✅ Endpoint ${endpointKey} POST test completed: ${postResponse.status}`,
            );
          } else {
            // Test with GET method for other endpoints
            const response = await fetch(testUrl, {
              method: "GET",
              headers: {
                Accept: "application/json",
                "User-Agent": "AI-Nutrition-App/1.0",
              },
              signal: AbortSignal.timeout(5000),
            });

            testResults.endpoints_test[endpointKey] = {
              endpoint,
              url: testUrl,
              status_code: response.status,
              status_text: response.statusText,
              exists: true,
              method_allowed: response.status !== 404,
            };

            console.log(
              `✅ Endpoint ${endpointKey} GET test completed: ${response.status}`,
            );
          }
        } catch (error) {
          testResults.endpoints_test[endpointKey] = {
            endpoint,
            url: `${MEAL_OPTIMIZATION_CONFIG.API_BASE_URL}${endpoint}`,
            error: error instanceof Error ? error.message : "Unknown error",
            exists: false,
          };
          console.log(`❌ Endpoint ${endpointKey} test failed:`, error);
        }
      }
    }

    console.log("🧪 Test completed, returning results");

    return addCorsHeaders(
      NextResponse.json({
        status: "success",
        message: "External service connection test completed",
        timestamp: new Date().toISOString(),
        results: testResults,
      }),
    );
  } catch (error) {
    console.error("❌ Test endpoint error:", error);

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
