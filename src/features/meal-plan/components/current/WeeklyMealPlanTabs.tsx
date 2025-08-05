"use client";

import { adjustMealIngredientsDirect } from "@/ai/flows/adjust-meal-ingredients-direct";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MealCardItem from "@/features/meal-plan/components/current/MealCardItem";
import { editMealPlan } from "@/features/meal-plan/lib/data-service";
import { getAdjustedMealInput } from "@/features/meal-plan/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryParams } from "@/hooks/useQueryParams";
import { daysOfWeek } from "@/lib/constants";
import { UserProfile, UserMealPlan, UserPlan } from "@/lib/schemas";
import { useState } from "react";

function WeeklyMealPlanTabs({
  profile,
  plan,
  mealPlan,
  userId,
}: {
  profile: UserProfile;
  plan: UserPlan;
  mealPlan: UserMealPlan;
  userId?: string;
}) {
  const { toast } = useToast();
  const { getQueryParams, updateAndRemoveQueryParams } = useQueryParams();

  const [optimizingMealKey, setOptimizingMealKey] = useState<string | null>(
    null,
  );
  const [mealPlanState, setMealPlanState] = useState<UserMealPlan | null>(
    mealPlan,
  );

  async function handleOptimizeMeal(dayIndex: number, mealIndex: number) {
    const meal_data = mealPlan.meal_data;

    if (!meal_data) {
      toast({
        title: "Error",
        description: "Meal plan data is not available.",
        variant: "destructive",
      });
      return;
    }

    const mealToOptimize = meal_data.days[dayIndex].meals[mealIndex];
    const mealKey = `${meal_data.days[dayIndex].dayOfWeek || meal_data.days[dayIndex].dayOfWeek}-${mealToOptimize.name}-${mealIndex}`;
    setOptimizingMealKey(mealKey);

    try {
      const dailyTargets = {
        targetCalories:
          plan.custom_total_calories ?? plan.target_daily_calories ?? 2000,
        targetProtein: plan.custom_protein_g ?? plan.target_protein_g ?? 150,
        targetCarbs: plan.custom_carbs_g ?? plan.target_carbs_g ?? 250,
        targetFat: plan.custom_fat_g ?? plan.target_fat_g ?? 67,
      };

      // Validate daily targets to ensure they're not null or invalid
      if (!dailyTargets.targetCalories || dailyTargets.targetCalories <= 0) {
        toast({
          title: "Error",
          description: "Invalid daily calorie target. Please update your nutrition plan.",
          variant: "destructive",
        });
        return;
      }

      if (
        dailyTargets.targetCalories <= 0 ||
        dailyTargets.targetProtein <= 0 ||
        dailyTargets.targetCarbs <= 0 ||
        dailyTargets.targetFat <= 0
      ) {
        toast({
          title: "Calculation Error",
          description:
            "Could not calculate daily targets from profile. Ensure profile is complete. This might happen if some values are zero or invalid.",
          variant: "destructive",
        });
        setOptimizingMealKey(null);
        return;
      }

      const aiInput = getAdjustedMealInput(
        profile,
        dailyTargets,
        mealToOptimize,
      );

      // Fix type compatibility for direct API
      const directApiInput = {
        ...aiInput,
        userProfile: {
          ...aiInput.userProfile,
          age: aiInput.userProfile.age ?? 30, // Default age instead of null
          primary_diet_goal:
            aiInput.userProfile.primary_diet_goal ?? "balanced",
          preferred_diet: aiInput.userProfile.preferred_diet ?? "",
          allergies: aiInput.userProfile.allergies ?? [],
          dispreferrred_ingredients:
            aiInput.userProfile.dispreferrred_ingredients ?? [],
          preferred_ingredients:
            aiInput.userProfile.preferred_ingredients ?? [],
        },
        // Ensure targetMacros values are numbers
        targetMacros: {
          calories: Number(aiInput.targetMacros.calories),
          protein: Number(aiInput.targetMacros.protein),
          carbs: Number(aiInput.targetMacros.carbs),
          fat: Number(aiInput.targetMacros.fat),
        },
        // Ensure originalMeal has all required properties
        originalMeal: {
          ...aiInput.originalMeal,
          custom_name: aiInput.originalMeal.custom_name || "",
          ingredients: aiInput.originalMeal.ingredients.map((ing) => ({
            ...ing,
            quantity: Number(ing.quantity) || 0,
            unit: ing.unit || "g",
            calories: Number(ing.calories) || 0,
            protein: Number(ing.protein) || 0,
            carbs: Number(ing.carbs) || 0,
            fat: Number(ing.fat) || 0,
          })),
        },
      };
      const optimizationData = getAdjustedMealInput(
        profile,
        dailyTargets,
        mealToOptimize,
      );

      // Deep copy to avoid mutation
      const newWeeklyPlan = JSON.parse(JSON.stringify(meal_data));

      const response = await fetch('/api/meal-plan/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optimizationData,
          mealPlan: { dayIndex, mealIndex, newWeeklyPlan },
          userId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to optimize meal');
      }

      // Update state while preserving all existing data
      setMealPlanState((prevMeal) => {
        if (!prevMeal?.meal_data) return prevMeal;
        
        const updatedMealData = { ...prevMeal.meal_data };
        
        // Only update the specific meal that was optimized
        if (updatedMealData.days[dayIndex] && updatedMealData.days[dayIndex].meals[mealIndex]) {
          updatedMealData.days[dayIndex].meals[mealIndex] = {
            ...updatedMealData.days[dayIndex].meals[mealIndex],
            ...result.data.adjustedMeal
          };
        }
        
        return {
          ...prevMeal,
          meal_data: updatedMealData
        };
      });

      toast({
        title: `Meal Optimized: ${mealToOptimize.name}`,
        description: result.data.explanation || "AI has adjusted the ingredients.",
      });
    } catch (error: any) {
      console.error("Error optimizing meal:", error);
      console.error("Full AI error object:", error);
      const errorMessage =
        error.message || "Unknown error during optimization.";
      toast({
        title: "Optimization Failed",
        description: `Could not optimize meal: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setOptimizingMealKey(null);
    }
  }

  // Handle empty meal plan
  if (!mealPlanState?.meal_data?.days || mealPlanState.meal_data.days.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No Meal Plan Found</h3>
        <p className="text-muted-foreground mb-4">
          You haven't created a meal plan yet. Go to the Optimized section to generate your first AI meal plan.
        </p>
      </div>
    );
  }

  return (
    <Tabs
      defaultValue={getQueryParams("selected_day") ?? daysOfWeek[0]}
      className="w-full"
    >
      <ScrollArea className="w-full whitespace-nowrap rounded-md">
        <TabsList className="inline-flex h-auto">
          {daysOfWeek.map((day) => (
            <TabsTrigger
              onClick={() => {
                updateAndRemoveQueryParams({ selected_day: day }, [
                  "selected_meal",
                  "is_edit",
                ]);
              }}
              key={day}
              value={day}
              className="px-4 py-2 text-base"
            >
              {day}
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {mealPlanState?.meal_data?.days.map((dayPlan, dayIndex) => (
        <TabsContent
          key={dayPlan.dayOfWeek || dayPlan.dayOfWeek}
          value={dayPlan.dayOfWeek || dayPlan.dayOfWeek}
          className="mt-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dayPlan.meals.map((meal, mealIndex) => (
              <MealCardItem
                key={mealIndex}
                meal={meal}
                dayPlan={dayPlan}
                mealIndex={mealIndex}
                dayIndex={dayIndex}
                optimizingKey={optimizingMealKey}
                onOptimizeMeal={handleOptimizeMeal}
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export default WeeklyMealPlanTabs;