"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import OptimizedAiMealPlan from "./OptimizedAiMealPlan";
import type { GeneratePersonalizedMealPlanOutput } from "@/lib/schemas";

interface MealPlanOverviewProps {
  mealPlan: any;
  userTargets?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function MealPlanOverview({ mealPlan, userTargets }: MealPlanOverviewProps) {
  const [currentMealPlan, setCurrentMealPlan] = useState<GeneratePersonalizedMealPlanOutput | null>(
    mealPlan?.ai_plan || null
  );

  console.log(
    "MealPlanOverview received mealPlan:",
    JSON.stringify(mealPlan, null, 2),
  );

  if (!currentMealPlan || !Array.isArray((currentMealPlan as any).weeklyMealPlan)) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            No AI meal plan generated yet or invalid meal plan data.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleOptimizationComplete = (updatedPlan: GeneratePersonalizedMealPlanOutput) => {
    setCurrentMealPlan(updatedPlan);
  };

  // Use optimized meal plan component
  return (
    <OptimizedAiMealPlan
      mealPlan={currentMealPlan}
      userTargets={userTargets}
      onOptimizationComplete={handleOptimizationComplete}
    />
  );
}