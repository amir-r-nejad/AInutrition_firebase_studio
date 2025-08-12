
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Utensils, Calculator } from "lucide-react";
import { suggestSingleMealWithOptimization } from "@/ai/flows/suggest-single-meal-optimized";
import type { SuggestSingleMealInput, OptimizedMealResult } from "@/lib/schemas";

interface Props {
  formData: any;
  targetMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
}

export function AIMealSuggestionGenerator({ formData, targetMacros }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [mealResult, setMealResult] = useState<OptimizedMealResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!targetMacros) {
      setError("Please set target macros using the form above");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const input: SuggestSingleMealInput = {
        meal_name: formData.meal_name || "Custom Meal",
        target_calories: targetMacros.calories,
        target_protein_grams: targetMacros.protein,
        target_carbs_grams: targetMacros.carbs,
        target_fat_grams: targetMacros.fat,
        age: formData.age,
        gender: formData.gender,
        activity_level: formData.activity_level,
        diet_goal: formData.diet_goal,
        preferred_diet: formData.preferred_diet,
        preferred_cuisines: formData.preferred_cuisines || [],
        dispreferrred_cuisines: formData.dispreferrred_cuisines || [],
        preferred_ingredients: formData.preferred_ingredients || [],
        dispreferrred_ingredients: formData.dispreferrred_ingredients || [],
        allergies: formData.allergies || [],
        medical_conditions: formData.medical_conditions || [],
        preferences: formData.preferences || "",
      };

      const result = await suggestSingleMealWithOptimization(input);
      setMealResult(result);
    } catch (err: any) {
      console.error("Error generating meal:", err);
      setError(err.message || "Failed to generate meal suggestion");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !targetMacros}
          className="min-w-[200px]"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Optimizing Meal...
            </>
          ) : (
            <>
              <Utensils className="mr-2 h-4 w-4" />
              Generate Optimized Meal
            </>
          )}
        </Button>
        {!targetMacros && (
          <p className="text-sm text-muted-foreground mt-2">
            Set your macro targets above to generate a meal
          </p>
        )}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {mealResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Utensils className="mr-2 h-5 w-5" />
                {mealResult.dishName}
              </CardTitle>
              <Badge variant="secondary" className="flex items-center">
                <Calculator className="mr-1 h-3 w-3" />
                Optimized
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            <div>
              <h4 className="font-medium mb-2">About This Dish</h4>
              <p className="text-sm text-muted-foreground">{mealResult.description}</p>
            </div>

            {/* Optimized Ingredients */}
            <div>
              <h4 className="font-medium mb-3">Optimized Ingredients</h4>
              <div className="grid gap-3">
                {mealResult.optimizedIngredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-white rounded-lg border"
                  >
                    <div>
                      <span className="font-medium">{ingredient.name}</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {ingredient.amount.toFixed(1)}g
                      </span>
                    </div>
                    <div className="text-sm text-right">
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <span>{ingredient.calories.toFixed(0)} cal</span>
                        <span>{ingredient.protein.toFixed(1)}g P</span>
                        <span>{ingredient.carbs.toFixed(1)}g C</span>
                        <span>{ingredient.fat.toFixed(1)}g F</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Macro Comparison */}
            <div>
              <h4 className="font-medium mb-3">Macro Targets vs Achieved</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-muted-foreground">Target</h5>
                  <div className="space-y-1 text-sm">
                    <div>Calories: {targetMacros.calories}</div>
                    <div>Protein: {targetMacros.protein}g</div>
                    <div>Carbs: {targetMacros.carbs}g</div>
                    <div>Fat: {targetMacros.fat}g</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-muted-foreground">Achieved</h5>
                  <div className="space-y-1 text-sm">
                    <div>Calories: {mealResult.achievedMacros.calories.toFixed(0)}</div>
                    <div>Protein: {mealResult.achievedMacros.protein.toFixed(1)}g</div>
                    <div>Carbs: {mealResult.achievedMacros.carbs.toFixed(1)}g</div>
                    <div>Fat: {mealResult.achievedMacros.fat.toFixed(1)}g</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Optimization Status */}
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <span className="text-sm font-medium">Optimization Status:</span>
              <Badge variant={mealResult.optimizationStatus === "Optimal" ? "default" : "secondary"}>
                {mealResult.optimizationStatus}
              </Badge>
            </div>

            {mealResult.totalDeviation !== undefined && (
              <div className="text-center p-2 bg-white rounded border">
                <span className="text-xs text-muted-foreground">
                  Total Deviation: {mealResult.totalDeviation.toFixed(2)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
