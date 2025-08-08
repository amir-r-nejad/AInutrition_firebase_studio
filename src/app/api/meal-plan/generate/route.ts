import { generatePersonalizedMealPlan } from "@/ai/flows/generate-meal-plan";
import { getUser } from "@/features/profile/lib/data-services";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 180; // 3 minutes timeout

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 API: Starting OpenAI meal plan generation");

    const body = await request.json();
    const { profile, mealTargets } = body;

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

    console.log("🤖 API: Calling OpenAI meal plan generation for user:", userId);
    console.log("📊 API: Meal targets:", JSON.stringify(mealTargets, null, 2));

    // Generate meal plan with enhanced error handling
    const result = await generatePersonalizedMealPlan({
      ...profile,
      mealTargets: mealTargets,
    }, userId);

    if (!result || !result.weeklyMealPlan || !result.weeklySummary) {
      console.error("❌ API: Invalid result from meal plan generation");
      return NextResponse.json(
        { error: "Invalid meal plan generated" },
        { status: 500 },
      );
    }

    console.log("✅ API: Successfully generated OpenAI meal plan");
    console.log("📈 API: Weekly summary:", JSON.stringify(result.weeklySummary, null, 2));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ API: Error generating OpenAI meal plan:", error);

    // Enhanced error handling with specific error types for OpenAI
    if (error.message?.includes("OPENAI_API_KEY") || error.message?.includes("OpenAI API key")) {
      return NextResponse.json(
        { error: "OpenAI API key configuration error. Please contact support." },
        { status: 500 },
      );
    } else if (
      error.message?.includes("rate limit") ||
      error.message?.includes("429") ||
      error.status === 429
    ) {
      return NextResponse.json(
        {
          error: "OpenAI service is currently busy. Please try again in a few minutes.",
        },
        { status: 429 },
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
          error: error.message || "Failed to generate OpenAI meal plan",
          details: "An unexpected error occurred during meal plan generation",
        },
        { status: 500 },
      );
    }
  }
}