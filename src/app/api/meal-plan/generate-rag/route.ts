import { generateMealPlanWithRAG } from "@/ai/flows/generate-meal-plan-rag";
import { getUser } from "@/features/profile/lib/data-services";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 180; // 3 minutes timeout

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 API: Starting RAG-based meal plan generation");

    const body = await request.json();
    const { profile, mealTargets } = body;

    // Test RAG API connectivity first
    console.log("🔍 Testing RAG API connectivity...");
    try {
      const testResponse = await fetch("https://web-production-55aa.up.railway.app/health", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("RAG API Health Check Status:", testResponse.status);
    } catch (testError) {
      console.error("RAG API Health Check Failed:", testError);
      return NextResponse.json(
        { error: "RAG service is not accessible. Please try again later." },
        { status: 503 },
      );
    }

    if (!profile || !mealTargets) {
      console.error("❌ API: Missing required data", {
        profile: !!profile,
        mealTargets: !!mealTargets,
      });
      return NextResponse.json(
        { error: "Missing profile or meal targets" },
        { status: 400 },
      );
    }

    // Validate meal targets structure
    if (!Array.isArray(mealTargets) || mealTargets.length !== 6) {
      console.error("❌ API: Invalid meal targets structure");
      return NextResponse.json(
        { error: "Meal targets must be an array of 6 meals" },
        { status: 400 },
      );
    }

    // Validate each meal target
    for (const meal of mealTargets) {
      if (!meal.mealName || typeof meal.calories !== 'number' || meal.calories <= 0) {
        console.error("❌ API: Invalid meal target:", meal);
        return NextResponse.json(
          { error: `Invalid meal target: ${meal.mealName || 'Unknown meal'}` },
          { status: 400 },
        );
      }
    }

    // Get user ID
    const user = await getUser();
    const userId = user?.id;

    if (!userId) {
      console.error("❌ API: User not authenticated");
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    console.log("🤖 API: Calling RAG meal plan generation for user:", userId);
    console.log("📊 API: Meal targets:", JSON.stringify(mealTargets, null, 2));

    // Prepare RAG input from profile and meal targets
    const ragInput = {
      mealTargets: mealTargets,
      preferred_diet: profile.preferred_diet,
      preferences: profile.preferences,
      preferred_cuisines: profile.preferred_cuisines,
      dispreferrred_cuisines: profile.dispreferrred_cuisines,
      preferred_ingredients: profile.preferred_ingredients,
      dispreferrred_ingredients: profile.dispreferrred_ingredients,
      allergies: profile.allergies,
      medical_conditions: profile.medical_conditions,
      medications: profile.medications,
    };

    // Generate meal plan with RAG
    const result = await generateMealPlanWithRAG(ragInput);

    if (!result || !result.weeklyMealPlan || !result.weeklySummary) {
      console.error("❌ API: Invalid result from RAG meal plan generation");
      return NextResponse.json(
        { error: "Invalid meal plan generated" },
        { status: 500 },
      );
    }

    console.log("✅ API: Successfully generated RAG meal plan");
    console.log("📈 API: Weekly summary:", JSON.stringify(result.weeklySummary, null, 2));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ API: Error generating RAG meal plan:", error);

    // Enhanced error handling with specific error types for RAG
    if (error.message?.includes("RAG API error")) {
      return NextResponse.json(
        { error: "RAG service is currently unavailable. Please try again later." },
        { status: 503 },
      );
    } else if (
      error.message?.includes("timeout") ||
      error.message?.includes("DEADLINE_EXCEEDED") ||
      error.code === "DEADLINE_EXCEEDED"
    ) {
      return NextResponse.json(
        {
          error: "Request timed out. Your meal plan may still be generating. Please check back in a moment.",
        },
        { status: 408 },
      );
    } else if (
      error.message?.includes("network") ||
      error.message?.includes("fetch") ||
      error.name === "TypeError"
    ) {
      return NextResponse.json(
        {
          error: "Network connection error. Please check your connection and try again.",
        },
        { status: 503 },
      );
    } else if (
      error.message?.includes("Invalid JSON") ||
      error.message?.includes("validation")
    ) {
      return NextResponse.json(
        {
          error: "Invalid input data. Please check your meal targets and try again.",
          details: error.message,
        },
        { status: 400 },
      );
    } else {
      return NextResponse.json(
        {
          error: error.message || "Failed to generate RAG meal plan",
          details: "An unexpected error occurred during meal plan generation",
        },
        { status: 500 },
      );
    }
  }
}


