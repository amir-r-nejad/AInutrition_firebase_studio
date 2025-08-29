"use client";

import { useState } from "react";
import { SingleMealOptimizationService } from "@/services/single-meal-optimization";
import {
  SingleMealOptimizationRequest,
  RAGResponse,
} from "@/types/meal-optimization";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Target, ChefHat, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLastOptimizationResult } from "@/hooks/useLastOptimizationResult";
import { LastOptimizationResult } from "@/components/LastOptimizationResult";

interface SingleMealOptimizationFormProps {
  ragResponse: RAGResponse;
  onOptimizationComplete: (result: any) => void;
  targetMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  mealType: string; // e.g., "lunch", "breakfast", "dinner"
}

// Interface for the old structure that comes from AI suggestions
interface OldIngredientDetail {
  name: string;
  amount: string;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  macrosString: string;
}

interface OldMealSuggestion {
  mealTitle: string;
  description: string;
  ingredients: OldIngredientDetail[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  instructions?: string;
}

interface OldRAGResponse {
  suggestions: OldMealSuggestion[];
  success: boolean;
  message?: string;
}

export const SingleMealOptimizationForm: React.FC<
  SingleMealOptimizationFormProps
> = ({ ragResponse, onOptimizationComplete, targetMacros, mealType }) => {
  const { toast } = useToast();

  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // استفاده از hook برای مدیریت آخرین نتیجه
  const { lastResult, saveResult, clearResult } = useLastOptimizationResult(
    mealType,
    "single-meal",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);

    try {
      console.log("Submitting single meal optimization request:", {
        ragResponse,
        targetMacros,
        mealType,
      });

      // 🔍 DEBUG: Check if data is already converted
      console.log("🔍 RAG Response structure check:", {
        first_ingredient: ragResponse.suggestions?.[0]?.ingredients?.[0],
        has_protein_per_100g:
          "protein_per_100g" in
          (ragResponse.suggestions?.[0]?.ingredients?.[0] || {}),
        has_protein:
          "protein" in (ragResponse.suggestions?.[0]?.ingredients?.[0] || {}),
      });

      // Check if data is already in per 100g format
      const isAlreadyPer100g =
        ragResponse.suggestions?.[0]?.ingredients?.[0]?.hasOwnProperty(
          "protein_per_100g",
        );

      let convertedRagResponse;

      if (isAlreadyPer100g) {
        // Data is already converted, use as is
        console.log("✅ Data already in per 100g format, using as is");
        convertedRagResponse = ragResponse;
      } else {
        // Convert old structure to new structure
        console.log("🔄 Converting from total values to per 100g format");
        const oldRagResponse = ragResponse as unknown as OldRAGResponse;
        convertedRagResponse = {
          suggestions: oldRagResponse.suggestions.map(
            (suggestion: OldMealSuggestion) => ({
              ingredients: suggestion.ingredients.map(
                (ingredient: OldIngredientDetail) => {
                  // Convert total values to per 100g values
                  const amountInGrams = Number(ingredient.amount) || 100;
                  const conversionFactor = 100 / amountInGrams;

                  console.log(`🔍 Converting ${ingredient.name}:`, {
                    amount: amountInGrams,
                    total_calories: ingredient.calories,
                    total_protein: ingredient.protein,
                    total_carbs: ingredient.carbs,
                    total_fat: ingredient.fat,
                    conversion_factor: conversionFactor,
                  });

                  return {
                    name: ingredient.name,
                    protein_per_100g:
                      Math.round(
                        (ingredient.protein || 0) * conversionFactor * 100,
                      ) / 100,
                    carbs_per_100g:
                      Math.round(
                        (ingredient.carbs || 0) * conversionFactor * 100,
                      ) / 100,
                    fat_per_100g:
                      Math.round(
                        (ingredient.fat || 0) * conversionFactor * 100,
                      ) / 100,
                    calories_per_100g:
                      Math.round(
                        (ingredient.calories || 0) * conversionFactor * 100,
                      ) / 100,
                    quantity_needed: 100, // Standard per 100g basis for optimization
                  };
                },
              ),
            }),
          ),
          success: true,
          message: "Converted from AI suggestions with per 100g conversion",
        };
      }

      // Use default preferences since they're already set in the main preferences section
      const defaultPreferences = {
        diet_type: "high_protein",
        allergies: [],
        preferences: ["low_sodium", "organic"],
      };

      const request: SingleMealOptimizationRequest = {
        rag_response: convertedRagResponse,
        target_macros: {
          calories: targetMacros.calories,
          protein: targetMacros.protein,
          carbs: targetMacros.carbs, // Changed from carbohydrates to carbs
          fat: targetMacros.fat,
        },
        user_preferences: defaultPreferences,
        user_id: "user_123", // TODO: Get from authentication system
        meal_type: mealType,
      };

      console.log("Sending request to Single Meal Optimization API:", request);

      // 🔍 DEBUG: Log the converted ingredients
      console.log("🔍 CONVERTED INGREDIENTS DEBUG:");
      convertedRagResponse.suggestions[0].ingredients.forEach((ing) => {
        console.log(`  - ${ing.name}:`, {
          protein_per_100g: ing.protein_per_100g,
          carbs_per_100g: ing.carbs_per_100g,
          fat_per_100g: ing.fat_per_100g,
          calories_per_100g: ing.calories_per_100g,
        });
      });

      const result =
        await SingleMealOptimizationService.optimizeSingleMeal(request);
      console.log("Single meal optimization result received:", result);

      // ذخیره آخرین نتیجه
      saveResult(result);

      onOptimizationComplete(result);

      toast({
        title: "Success!",
        description: `Your ${mealType} has been optimized successfully!`,
        variant: "default",
      });
    } catch (err) {
      console.error("Single meal optimization failed:", err);

      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setLocalError(errorMessage);

      toast({
        title: "Optimization Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-primary" />
          Optimize Your {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
        </CardTitle>
        <CardDescription>
          Use our advanced Single Meal Optimization API to perfect your macros
          and get personalized recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Optimization Info */}
          <div className="p-4 border rounded-md bg-blue-50">
            <h3 className="text-lg font-medium mb-3 text-blue-800">
              Ready to Optimize Your{" "}
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}!
            </h3>
            <p className="text-sm text-blue-700">
              Your preferences and target macros are already set from the main
              preferences section above. Click the button below to start the
              optimization process using our advanced RAG optimization service.
            </p>
          </div>

          {/* نمایش آخرین نتیجه */}
          <LastOptimizationResult
            lastResult={lastResult}
            onClear={clearResult}
          />

          {localError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">Optimization Error</p>
              </div>
              <p className="text-red-700 mt-2">{localError}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Optimizing{" "}
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}...
              </>
            ) : (
              <>
                <Target className="mr-2 h-5 w-5" />
                Optimize {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
