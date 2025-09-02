"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Zap, Clock, Target, TrendingUp } from "lucide-react";
import type { GeneratePersonalizedMealPlanOutput } from "@/lib/schemas";

interface OptimizedAiMealPlanProps {
  mealPlan: GeneratePersonalizedMealPlanOutput;
  userTargets?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onOptimizationComplete?: (
    updatedPlan: GeneratePersonalizedMealPlanOutput,
  ) => void;
}

interface OptimizationState {
  dayIndex: number;
  mealIndex: number;
  isOptimizing: boolean;
}

export default function OptimizedAiMealPlan({
  mealPlan,
  userTargets,
  onOptimizationComplete,
}: OptimizedAiMealPlanProps) {
  const [optimizationState, setOptimizationState] =
    useState<OptimizationState | null>(null);
  const [isOptimizing, startTransition] = useTransition();
  const { toast } = useToast();
  const [activeDay, setActiveDay] = useState(0);

  const calculateMacroAccuracy = (actual: number, target: number) => {
    if (target === 0) return 100;
    const accuracy = Math.max(
      0,
      100 - Math.abs((actual - target) / target) * 100,
    );
    return Math.round(accuracy);
  };

  const getMacroStatus = (accuracy: number) => {
    if (accuracy >= 95)
      return {
        color: "text-green-600",
        bg: "bg-green-100",
        status: "Excellent",
      };
    if (accuracy >= 90)
      return { color: "text-blue-600", bg: "bg-blue-100", status: "Good" };
    if (accuracy >= 80)
      return { color: "text-yellow-600", bg: "bg-yellow-100", status: "Fair" };
    return {
      color: "text-red-600",
      bg: "bg-red-100",
      status: "Needs Optimization",
    };
  };

  const sumMealFromIngredients = (meal: any) => {
    const ingredients = Array.isArray(meal?.ingredients)
      ? meal.ingredients
      : [];
    return ingredients.reduce(
      (
        acc: { calories: number; protein: number; carbs: number; fat: number },
        ing: any,
      ) => {
        const cals =
          Number(
            ing?.calories ??
              (ing as any)?.kcal ??
              (ing as any)?.cal ??
              (ing as any)?.energy_kcal ??
              0,
          ) || 0;
        const prot =
          Number(
            ing?.protein ??
              (ing as any)?.prot ??
              (ing as any)?.proteins ??
              (ing as any)?.protein_g ??
              0,
          ) || 0;
        const carbs =
          Number(
            ing?.carbs ??
              (ing as any)?.carb ??
              (ing as any)?.carbohydrates ??
              (ing as any)?.carbohydrates_g ??
              0,
          ) || 0;
        const fat =
          Number(ing?.fat ?? (ing as any)?.fats ?? (ing as any)?.fat_g ?? 0) ||
          0;
        return {
          calories: acc.calories + cals,
          protein: acc.protein + prot,
          carbs: acc.carbs + carbs,
          fat: acc.fat + fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  };

  const optimizeMeal = async (
    dayIndex: number,
    mealIndex: number,
    targetMacros: any,
  ) => {
    setOptimizationState({ dayIndex, mealIndex, isOptimizing: true });

    startTransition(async () => {
      try {
        console.log("🔧 Starting meal optimization:", {
          dayIndex,
          mealIndex,
          targetMacros,
        });

        // Use the same optimization API as meal suggestion
        const response = await fetch("/api/meal-optimization/single-meal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rag_response: {
              suggestions: [{
                ingredients: mealPlan.weeklyMealPlan[dayIndex].meals[mealIndex].ingredients.map((ingredient: any) => ({
                  name: ingredient.name,
                  protein_per_100g: (ingredient.protein / ingredient.quantity) * 100,
                  carbs_per_100g: (ingredient.carbs / ingredient.quantity) * 100,
                  fat_per_100g: (ingredient.fat / ingredient.quantity) * 100,
                  calories_per_100g: (ingredient.calories / ingredient.quantity) * 100,
                  quantity_needed: ingredient.quantity,
                }))
              }]
            },
            target_macros: {
              calories: targetMacros.calories,
              protein: targetMacros.protein,
              carbs: targetMacros.carbs,
              fat: targetMacros.fat,
            },
            user_preferences: {
              diet_type: "balanced",
              allergies: [],
              preferences: []
            },
            meal_type: mealPlan.weeklyMealPlan[dayIndex].meals[mealIndex].meal_name,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to optimize meal");
        }

        const result = await response.json();
        console.log("✅ Optimization successful:", result);

        // Update the meal plan with optimized data
        if (result.updatedMealPlan && onOptimizationComplete) {
          onOptimizationComplete(result.updatedMealPlan);
        }

        toast({
          title: "Meal Optimized! 🎯",
          description: `Successfully optimized ${mealPlan.weeklyMealPlan[dayIndex].meals[mealIndex].meal_name} to match your macro targets with mathematical precision.`,
        });
      } catch (error: any) {
        console.error("❌ Optimization error:", error);
        toast({
          title: "Optimization Failed",
          description:
            error.message || "Failed to optimize meal. Please try again.",
          variant: "destructive",
        });
      } finally {
        setOptimizationState(null);
      }
    });
  };

  const calculateDailyTargets = (dayIndex: number) => {
    if (!userTargets) return null;

    // Calculate targets per meal (assuming 6 meals per day)
    const mealsPerDay = mealPlan.weeklyMealPlan[dayIndex]?.meals?.length || 6;

    return {
      calories: Math.round(userTargets.calories / mealsPerDay),
      protein: Math.round((userTargets.protein / mealsPerDay) * 10) / 10,
      carbs: Math.round((userTargets.carbs / mealsPerDay) * 10) / 10,
      fat: Math.round((userTargets.fat / mealsPerDay) * 10) / 10,
    };
  };

  return (
    <div className="space-y-6">
      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Weekly Meal Plan Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {mealPlan.weeklySummary.totalCalories.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Calories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {mealPlan.weeklySummary.totalProtein}g
              </div>
              <div className="text-sm text-gray-600">Total Protein</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {mealPlan.weeklySummary.totalCarbs}g
              </div>
              <div className="text-sm text-gray-600">Total Carbs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {mealPlan.weeklySummary.totalFat}g
              </div>
              <div className="text-sm text-gray-600">Total Fat</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Days selector (bubbles) */}
      <div className="flex flex-wrap gap-2">
        {mealPlan.weeklyMealPlan.map((d, idx) => (
          <Button
            key={idx}
            onClick={() => setActiveDay(idx)}
            variant={activeDay === idx ? "secondary" : "outline"}
            className={`rounded-full h-9 md:h-10 px-4 md:px-5 text-sm md:text-base ${activeDay === idx ? "" : "text-foreground"}`}
          >
            {d.day}
          </Button>
        ))}
      </div>

      {/* Daily Meal Plans - selected day */}
      {(() => {
        const day = mealPlan.weeklyMealPlan[activeDay];
        const dayIndex = activeDay;
        const dailyTargets = calculateDailyTargets(dayIndex);
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {day?.day}
                </span>
                <div className="flex gap-2 text-sm">
                  <Badge variant="outline">
                    {day?.daily_totals?.calories || 0} cal
                  </Badge>
                  <Badge variant="outline">
                    {day?.daily_totals?.protein || 0}g protein
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {day?.meals?.map((meal, mealIndex) => {
                  const mealTargets = dailyTargets
                    ? {
                        calories: dailyTargets.calories,
                        protein: dailyTargets.protein,
                        carbs: dailyTargets.carbs,
                        fat: dailyTargets.fat,
                      }
                    : null;

                  let totalCals =
                    meal.total_calories ?? (meal as any).totalCalories ?? 0;
                  let totalProt =
                    meal.total_protein ?? (meal as any).totalProtein ?? 0;
                  let totalCarbs =
                    meal.total_carbs ?? (meal as any).totalCarbs ?? 0;
                  let totalFat = meal.total_fat ?? (meal as any).totalFat ?? 0;

                  // Fallback: compute totals from ingredients if missing/zero
                  if (!totalCals && !totalProt && !totalCarbs && !totalFat) {
                    const summed = sumMealFromIngredients(meal);
                    totalCals = Math.round(summed.calories * 100) / 100;
                    totalProt = Math.round(summed.protein * 100) / 100;
                    totalCarbs = Math.round(summed.carbs * 100) / 100;
                    totalFat = Math.round(summed.fat * 100) / 100;
                  }

                  const caloriesAccuracy = mealTargets
                    ? calculateMacroAccuracy(totalCals, mealTargets.calories)
                    : 100;
                  const proteinAccuracy = mealTargets
                    ? calculateMacroAccuracy(totalProt, mealTargets.protein)
                    : 100;
                  const carbsAccuracy = mealTargets
                    ? calculateMacroAccuracy(totalCarbs, mealTargets.carbs)
                    : 100;
                  const fatAccuracy = mealTargets
                    ? calculateMacroAccuracy(totalFat, mealTargets.fat)
                    : 100;

                  const overallAccuracy = Math.round(
                    (caloriesAccuracy +
                      proteinAccuracy +
                      carbsAccuracy +
                      fatAccuracy) /
                      4,
                  );
                  const macroStatus = getMacroStatus(overallAccuracy);

                  const isCurrentlyOptimizing =
                    optimizationState?.dayIndex === dayIndex &&
                    optimizationState?.mealIndex === mealIndex &&
                    optimizationState?.isOptimizing;

                  return (
                    <Card key={mealIndex}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {meal.meal_title}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {meal.meal_name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`${macroStatus.color} ${macroStatus.bg}`}
                            >
                              {macroStatus.status}
                            </Badge>
                            {mealTargets && overallAccuracy < 95 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  optimizeMeal(dayIndex, mealIndex, mealTargets)
                                }
                                disabled={isOptimizing}
                                className="flex items-center gap-1"
                              >
                                <Zap className="h-3 w-3" />
                                {isCurrentlyOptimizing
                                  ? "Optimizing..."
                                  : "Optimize"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Macro Accuracy Progress */}
                        {mealTargets && (
                          <div className="mb-4 space-y-2">
                            <div className="text-sm font-medium flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" />
                              Macro Accuracy
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div>
                                <div className="text-xs text-gray-600">
                                  Calories
                                </div>
                                <Progress
                                  value={caloriesAccuracy}
                                  className="h-2"
                                />
                                <div className="text-xs">
                                  {caloriesAccuracy}%
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-600">
                                  Protein
                                </div>
                                <Progress
                                  value={proteinAccuracy}
                                  className="h-2"
                                />
                                <div className="text-xs">
                                  {proteinAccuracy}%
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-600">
                                  Carbs
                                </div>
                                <Progress
                                  value={carbsAccuracy}
                                  className="h-2"
                                />
                                <div className="text-xs">{carbsAccuracy}%</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-600">Fat</div>
                                <Progress value={fatAccuracy} className="h-2" />
                                <div className="text-xs">{fatAccuracy}%</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Meal Macros */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-orange-600">
                              {totalCals}
                            </div>
                            <div className="text-xs text-gray-600">
                              calories
                            </div>
                            {mealTargets && (
                              <div className="text-xs text-gray-500">
                                / {mealTargets.calories}
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">
                              {totalProt}g
                            </div>
                            <div className="text-xs text-gray-600">protein</div>
                            {mealTargets && (
                              <div className="text-xs text-gray-500">
                                / {mealTargets.protein}g
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">
                              {totalCarbs}g
                            </div>
                            <div className="text-xs text-gray-600">carbs</div>
                            {mealTargets && (
                              <div className="text-xs text-gray-500">
                                / {mealTargets.carbs}g
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-purple-600">
                              {totalFat}g
                            </div>
                            <div className="text-xs text-gray-600">fat</div>
                            {mealTargets && (
                              <div className="text-xs text-gray-500">
                                / {mealTargets.fat}g
                              </div>
                            )}
                          </div>
                        </div>

                        <Separator className="my-3" />

                        {/* Ingredients table */}
                        <div>
                          <h4 className="font-medium mb-2">Ingredients</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="text-left border-b">
                                  <th className="py-2 pr-2">Ingredient</th>
                                  <th className="py-2 pr-2">Amount (g)</th>
                                  <th className="py-2 pr-2">Calories</th>
                                  <th className="py-2 pr-2">Protein (g)</th>
                                  <th className="py-2 pr-2">Carbs (g)</th>
                                  <th className="py-2 pr-2">Fat (g)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {meal.ingredients?.map(
                                  (ingredient, ingIndex) => {
                                    const cals =
                                      ingredient.calories ??
                                      (ingredient as any).kcal ??
                                      (ingredient as any).cal ??
                                      (ingredient as any).energy_kcal ??
                                      0;
                                    const prot =
                                      ingredient.protein ??
                                      (ingredient as any).prot ??
                                      (ingredient as any).proteins ??
                                      (ingredient as any).protein_g ??
                                      0;
                                    const carbs =
                                      ingredient.carbs ??
                                      (ingredient as any).carb ??
                                      (ingredient as any).carbohydrates ??
                                      (ingredient as any).carbohydrates_g ??
                                      0;
                                    const fat =
                                      ingredient.fat ??
                                      (ingredient as any).fats ??
                                      (ingredient as any).fat_g ??
                                      0;
                                    // Fix: 'amount' property does not exist on type, so check 'quantity' and 'unit'
                                    const amount =
                                      ingredient.quantity !== undefined
                                        ? ingredient.unit
                                          ? `${ingredient.quantity} ${ingredient.unit}`
                                          : ingredient.quantity
                                        : "-";
                                    return (
                                      <tr
                                        key={ingIndex}
                                        className="border-b last:border-0"
                                      >
                                        <td className="py-2 pr-2 font-medium">
                                          {ingredient.name}
                                        </td>
                                        <td className="py-2 pr-2">{amount}</td>
                                        <td className="py-2 pr-2">{cals}</td>
                                        <td className="py-2 pr-2">{prot}</td>
                                        <td className="py-2 pr-2">{carbs}</td>
                                        <td className="py-2 pr-2">{fat}</td>
                                      </tr>
                                    );
                                  },
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
