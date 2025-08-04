
import { editMealPlan } from "@/features/meal-plan/lib/data-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mealPlan, userId } = body;

    if (!mealPlan || !mealPlan.meal_data) {
      return NextResponse.json(
        { error: "Invalid meal plan data" },
        { status: 400 }
      );
    }

    const result = await editMealPlan(mealPlan, userId);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("API Error editing meal plan:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to update meal plan",
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
