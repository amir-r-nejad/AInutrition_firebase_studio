"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Target, ChefHat, AlertCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLastOptimizationResult } from "@/hooks/useLastOptimizationResult";
import { LastOptimizationResult } from "@/components/LastOptimizationResult";

interface OpenAIMealOptimizationFormProps {
  ragResponse: {
    suggestions: {
      ingredients: {
        name: string;
        protein_per_100g: number;
        carbs_per_100g: number;
        fat_per_100g: number;
        calories_per_100g: number;
        quantity_needed: number;
      }[];
    }[];
    success: boolean;
    message?: string;
  };
  onOptimizationComplete: (result: any) => void;
  targetMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  mealType: string;
}

export const OpenAIMealOptimizationForm: React.FC<OpenAIMealOptimizationFormProps> = ({
  ragResponse,
  onOptimizationComplete,
  targetMacros,
  mealType,
}) => {
  const { toast } = useToast();
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { lastResult, saveResult, clearResult } = useLastOptimizationResult(
    mealType,
    "meal-suggestion",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);

    try {
      console.log("Starting OpenAI-based meal optimization:", {
        ragResponse,
        targetMacros,
        mealType,
      });

      // Create the optimization prompt for OpenAI
      const prompt = `You are an expert AI nutritionist and optimization specialist. Your task is to optimize a meal using advanced optimization algorithms to EXACTLY match specific macronutrient targets.

**CURRENT INGREDIENTS (from RAG API):**
${ragResponse.suggestions[0].ingredients.map(ing => 
  `- ${ing.name}: ${ing.protein_per_100g}g protein, ${ing.carbs_per_100g}g carbs, ${ing.fat_per_100g}g fat, ${ing.calories_per_100g} kcal per 100g`
).join('\n')}

**TARGET MACROS (MUST BE REACHED EXACTLY):**
- Calories: ${targetMacros.calories} kcal
- Protein: ${targetMacros.protein}g
- Carbs: ${targetMacros.carbs}g
- Fat: ${targetMacros.fat}g

**OPTIMIZATION REQUIREMENTS:**
1. Use PuLP (Linear Programming), Genetic Algorithm, or Hybrid optimization methods
2. Calculate EXACT ingredient quantities (not just 100g multiples)
3. The TOTAL SUM of all ingredient macros MUST EXACTLY equal the target macros
4. If current ingredients cannot reach targets, ADD NEW INGREDIENTS to reach them
5. Use precise mathematical calculations to achieve EXACT target values
6. Ensure the meal remains balanced and appetizing

**CRITICAL: You MUST use proper optimization algorithms (PuLP/Linear Programming, Genetic Algorithm, or Hybrid) to calculate exact quantities. Do NOT use fixed 100g quantities. The sum of all ingredient macros MUST equal the target macros exactly.**

**OUTPUT FORMAT:**
Return ONLY valid JSON in this exact structure (do NOT nest under "optimized_meal"):
{
  "meal_name": "Optimized ${mealType}",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity_grams": 87.5,
      "calories": 131.25,
      "protein": 8.75,
      "carbs": 17.5,
      "fat": 4.375
    }
  ],
  "total_macros": {
    "calories": ${targetMacros.calories},
    "protein": ${targetMacros.protein},
    "carbs": ${targetMacros.carbs},
    "fat": ${targetMacros.fat}
  },
  "optimization_method": "pulp_linear_programming",
  "explanation": "Detailed explanation of optimization algorithm used and how exact targets were achieved",
  "target_achievement": "100% - All targets reached exactly using mathematical optimization"
}

**CRITICAL: Return ONLY valid JSON, no additional text or formatting. The data should be at the top level, not nested under "optimized_meal". Use proper optimization algorithms to calculate exact quantities, not fixed 100g amounts. The sum of all ingredient macros MUST equal the target macros exactly.**`;

      // Call OpenAI API
      const response = await fetch("/api/openai/optimize-meal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          targetMacros,
          mealType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to optimize meal with OpenAI");
      }

      const result = await response.json();
      console.log("OpenAI optimization result received:", result);
      
      // Extract the data from the response
      const optimizationData = result.data || result;
      console.log("Extracted optimization data:", optimizationData);

      // Save the result
      saveResult(optimizationData);
      onOptimizationComplete(optimizationData);

      toast({
        title: "Success!",
        description: `Your ${mealType} has been optimized using AI genetic algorithm!`,
        variant: "default",
      });
    } catch (err) {
      console.error("OpenAI optimization failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
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
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Powered Meal Optimization
        </CardTitle>
        <CardDescription>
          Use advanced AI with genetic algorithm principles to optimize your meal macros
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Optimization Info */}
          <div className="p-4 border rounded-md bg-blue-50">
            <h3 className="text-lg font-medium mb-3 text-blue-800">
              AI Genetic Algorithm Optimization
            </h3>
            <p className="text-sm text-blue-700">
              Our AI will analyze your ingredients and target macros, then use genetic algorithm principles to optimize quantities and suggest additional ingredients if needed to reach your targets.
            </p>
          </div>

          {/* Display last result */}
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
                AI Optimizing {mealType.charAt(0).toUpperCase() + mealType.slice(1)}...
              </>
            ) : (
              <>
                <Target className="mr-2 h-5 w-5" />
                AI Optimize {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
