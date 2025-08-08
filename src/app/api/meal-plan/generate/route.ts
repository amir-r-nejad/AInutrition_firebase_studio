import { generatePersonalizedMealPlanFlow } from "@/ai/flows/generate-meal-plan";
import { getUser } from "@/features/profile/lib/data-services";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 API: Starting meal plan generation");

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

    console.log("🤖 API: Calling AI meal plan generation for user:", userId);

    // Generate meal plan
    const result = await generatePersonalizedMealPlanFlow({
      ...profile,
      mealTargets: mealTargets,
    });

    console.log("✅ API: Successfully generated meal plan");

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ API: Error generating meal plan:", error);

    // Handle specific error types
    if (error.message?.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "AI service configuration error. Please contact support." },
        { status: 500 },
      );
    } else if (
      error.message?.includes("rate limit") ||
      error.message?.includes("429")
    ) {
      return NextResponse.json(
        {
          error:
            "AI service is currently busy. Please try again in a few minutes.",
        },
        { status: 429 },
      );
    } else if (
      error.message?.includes("network") ||
      error.message?.includes("fetch")
    ) {
      return NextResponse.json(
        {
          error:
            "Network connection error. Please check your connection and try again.",
        },
        { status: 503 },
      );
    } else {
      return NextResponse.json(
        {
          error: error.message || "Failed to generate meal plan",
          details: "An unexpected error occurred during meal plan generation",
        },
        { status: 500 },
      );
    }
  }
}
