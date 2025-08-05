
import { editMealPlan } from "@/features/meal-plan/lib/data-service-current";
import { adjustMealIngredientsDirect } from "@/ai/flows/adjust-meal-ingredients-direct";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { optimizationData, mealPlan, userId } = body;

    if (!optimizationData || !mealPlan) {
      return NextResponse.json(
        { error: "Invalid optimization data" },
        { status: 400 }
      );
    }

    // Validate target macros to ensure they're not null
    const { targetMacros } = optimizationData;
    if (!targetMacros || 
        typeof targetMacros.calories !== 'number' || 
        typeof targetMacros.protein !== 'number' || 
        typeof targetMacros.carbs !== 'number' || 
        typeof targetMacros.fat !== 'number') {
      return NextResponse.json(
        { 
          error: "Invalid target macros - all values must be valid numbers",
          receivedTargetMacros: targetMacros
        },
        { status: 400 }
      );
    }

    // Call AI optimization
    const result = await adjustMealIngredientsDirect(optimizationData);
    
    // Update meal plan with optimized meal - preserve existing data
    const { dayIndex, mealIndex, newWeeklyPlan } = mealPlan;
    
    // Only update the specific meal, preserve all other data
    if (newWeeklyPlan.days[dayIndex] && newWeeklyPlan.days[dayIndex].meals[mealIndex]) {
      newWeeklyPlan.days[dayIndex].meals[mealIndex] = {
        ...newWeeklyPlan.days[dayIndex].meals[mealIndex],
        ...result.adjustedMeal,
      };
    }
    
    // Save updated meal plan
    await editMealPlan({ meal_data: newWeeklyPlan }, userId);
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      updatedMealPlan: newWeeklyPlan
    });
  } catch (error: any) {
    console.error("API Error optimizing meal:", error);
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to optimize meal",
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
