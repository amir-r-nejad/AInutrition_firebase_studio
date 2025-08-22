"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Zap, Target, Loader2 } from "lucide-react";
import {
  optimizeMeal,
  convertMealToIngredients,
  createTargetsFromMacros,
  convertOptimizationToMeal,
} from "@/lib/optimization/meal-optimizer";

// Import the getFallbackNutrition function for helper ingredients
function getFallbackNutrition(ingredientName: string) {
  const NUTRITION_FALLBACKS: Record<string, { cal: number; prot: number; carb: number; fat: number }> = {
    "greek yogurt": { cal: 59, prot: 10, carb: 3.6, fat: 0.4 },
    "greek yogurt non-fat": { cal: 59, prot: 10, carb: 3.6, fat: 0.4 },
    "chicken breast": { cal: 165, prot: 31, carb: 0, fat: 3.6 },
    "egg white": { cal: 52, prot: 10.9, carb: 1.1, fat: 0.2 },
    "white rice raw": { cal: 365, prot: 7.1, carb: 80, fat: 0.7 },
    "brown rice raw": { cal: 370, prot: 7.9, carb: 77, fat: 2.9 },
    "pasta raw": { cal: 371, prot: 13, carb: 75, fat: 1.5 },
    "broccoli raw": { cal: 34, prot: 2.8, carb: 7.0, fat: 0.4 },
    "spinach": { cal: 23, prot: 2.9, carb: 3.6, fat: 0.4 },
    "cucumber raw": { cal: 16, prot: 0.7, carb: 3.6, fat: 0.1 },
    "olive oil": { cal: 884, prot: 0, carb: 0, fat: 100 },
    "avocado": { cal: 160, prot: 2, carb: 8.5, fat: 14.7 },
    "sweet potato raw": { cal: 86, prot: 1.6, carb: 20.1, fat: 0.1 },
  };

  const name = ingredientName.toLowerCase().trim();

  // Try exact match first
  if (NUTRITION_FALLBACKS[name]) {
    return NUTRITION_FALLBACKS[name];
  }

  // Try partial matches
  for (const [key, value] of Object.entries(NUTRITION_FALLBACKS)) {
    if (name.includes(key) || key.includes(name)) {
      return value;
    }
  }

  // Default fallback
  return { cal: 100, prot: 5, carb: 15, fat: 3 };
}

interface OptimizedMealSuggestionProps {
  originalSuggestion: any;
  targetMacros: any;
  onOptimizationComplete?: (optimizedMeal: any) => void;
}

const OptimizedMealSuggestion: React.FC<OptimizedMealSuggestionProps> = ({
  originalSuggestion,
  targetMacros,
  onOptimizationComplete,
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showOptimization, setShowOptimization] = useState(false);
  const [optimizedMeal, setOptimizedMeal] = useState<any>(null);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const { toast } = useToast();

  const handleOptimize = async () => {
    console.log("🔍 handleOptimize called!");
    setIsOptimizing(true);
    setShowOptimization(true);

    try {
      console.log(
        "🚀 Starting optimization with new Iterative Helper Selection Algorithm",
      );
      console.log("📥 Original suggestion:", originalSuggestion);
      console.log("🎯 Target macros:", targetMacros);

      // Convert the original meal suggestion to optimization format
      console.log("🔄 Converting meal to ingredients...");
      let ingredients = convertMealToIngredients(originalSuggestion);
      console.log("✅ Converted ingredients:", ingredients);

      console.log("🔄 Creating targets...");
      const targets = createTargetsFromMacros(targetMacros);
      console.log("✅ Created targets:", targets);

      console.log("📊 Optimization inputs:", { ingredients, targets });

      // Use the advanced mathematical optimizer
      console.log("🚀 Calling optimizeMeal...");
      let result: any;
      try {
        const mealName = targetMacros.mealName || 'snack';
        result = optimizeMeal(ingredients, targets, mealName);
        console.log("✅ Optimization result:", result);
      } catch (error) {
        console.error("💥 optimizeMeal crashed:", error);
        throw error;
      }

      if (result.feasible) {
        // Convert the optimization result back to meal format
        console.log("🔄 Converting result back to meal...");

        // Create complete ingredient list including any helpers that were added
        const allIngredients = [...ingredients];

        // Add any helpers that appear in the result but weren't in original ingredients
        Object.keys(result.ingredients).forEach(ingredientName => {
          const exists = allIngredients.find(ing => 
            ing.name.toLowerCase().trim() === ingredientName.toLowerCase().trim()
          );

          if (!exists) {
            // This is a helper ingredient, add it with fallback nutrition
            console.log(`🆘 Adding helper ingredient to conversion: ${ingredientName}`);
            const helperNutrition = getFallbackNutrition(ingredientName);
            allIngredients.push({
              name: ingredientName,
              cal: helperNutrition.cal / 100,
              prot: helperNutrition.prot / 100,
              carb: helperNutrition.carb / 100,
              fat: helperNutrition.fat / 100
            });
          }
        });

        console.log("🧮 All ingredients for conversion:", allIngredients.map(i => i.name));

        const optimized = convertOptimizationToMeal(
          originalSuggestion,
          result,
          allIngredients,
        );
        console.log("✅ Converted meal:", optimized);

        // Copy instructions from original suggestion
        if (originalSuggestion.instructions) {
          optimized.instructions = originalSuggestion.instructions;
        }

        setOptimizationResult(result);
        setOptimizedMeal(optimized);

        toast({
          title: "Optimization Complete!",
          description:
            "Meal has been optimized to match your exact macro targets using advanced mathematical programming.",
          variant: "default",
        });

        // Notify parent component
        if (onOptimizationComplete) {
          onOptimizationComplete(optimized);
        }
      } else {
        console.log("❌ Optimization failed:", result.error);
        toast({
          title: "Optimization Failed",
          description:
            result.error ||
            "Could not find a solution that matches your macro targets exactly, even with helper ingredients.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("💥 Optimization error:", error);
      toast({
        title: "Optimization Error",
        description: "An error occurred during optimization. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log("🏁 handleOptimize finished");
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Original AI Suggestion */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            AI Generated: {originalSuggestion.mealTitle}
          </CardTitle>
          <CardDescription className="text-sm">
            {originalSuggestion.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h4 className="font-medium text-md mb-2 text-primary">
              Original Macros:
            </h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                Calories: {originalSuggestion.totalCalories.toFixed(1)} kcal
              </Badge>
              <Badge variant="outline">
                Protein: {originalSuggestion.totalProtein.toFixed(1)}g
              </Badge>
              <Badge variant="outline">
                Carbs: {originalSuggestion.totalCarbs.toFixed(1)}g
              </Badge>
              <Badge variant="outline">
                Fat: {originalSuggestion.totalFat.toFixed(1)}g
              </Badge>
            </div>
          </div>

          <Button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="w-full mb-4"
          >
            {isOptimizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing with AI...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Optimize to Target Macros
              </>
            )}
          </Button>

          {targetMacros && (
            <div className="mb-4">
              <h4 className="font-medium text-md mb-2 text-primary">
                Target Macros:
              </h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Calories: {targetMacros.calories} kcal
                </Badge>
                <Badge variant="secondary">
                  Protein: {targetMacros.protein}g
                </Badge>
                <Badge variant="secondary">Carbs: {targetMacros.carbs}g</Badge>
                <Badge variant="secondary">Fat: {targetMacros.fat}g</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show optimization progress and results */}
      {showOptimization && (
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Optimization Results
            </CardTitle>
            <CardDescription className="text-sm">
              Meal has been optimized to match your exact macro targets using
              advanced linear programming with intelligent helper ingredient selection for precise macro achievement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isOptimizing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Analyzing deficits and selecting optimal helpers...
                </span>
              </div>
            ) : optimizedMeal ? (
              <div className="space-y-4">
                <div className="mb-4">
                  <h4 className="font-medium text-md mb-2 text-primary">
                    Optimized Preparation:
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {optimizedMeal.instructions ||
                      "Cook ingredients according to preference. Season to taste and serve."}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-md mb-2 text-primary">
                      Target Macros
                    </h4>
                    <div className="space-y-1">
                      <Badge variant="outline">
                        Calories: {targetMacros.calories} kcal
                      </Badge>
                      <Badge variant="outline">
                        Protein: {targetMacros.protein}g
                      </Badge>
                      <Badge variant="outline">
                        Carbs: {targetMacros.carbs}g
                      </Badge>
                      <Badge variant="outline">Fat: {targetMacros.fat}g</Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-md mb-2 text-primary">
                      Achieved Macros
                    </h4>
                    <div className="space-y-1">
                      <Badge
                        variant="secondary"
                        className={
                          Math.abs(
                            optimizedMeal.totalCalories - targetMacros.calories,
                          ) /
                            targetMacros.calories <=
                          0.02
                            ? "bg-green-100 text-green-800"
                            : Math.abs(
                                optimizedMeal.totalCalories - targetMacros.calories,
                              ) /
                                targetMacros.calories <=
                              0.05
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        Calories: {optimizedMeal.totalCalories} kcal
                        {Math.abs(optimizedMeal.totalCalories - targetMacros.calories) <= 1 && " ✓"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={
                          Math.abs(
                            optimizedMeal.totalProtein - targetMacros.protein,
                          ) /
                            targetMacros.protein <=
                          0.02
                            ? "bg-green-100 text-green-800"
                            : Math.abs(
                                optimizedMeal.totalProtein - targetMacros.protein,
                              ) /
                                targetMacros.protein <=
                              0.05
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        Protein: {optimizedMeal.totalProtein}g
                        {Math.abs(optimizedMeal.totalProtein - targetMacros.protein) <= 0.5 && " ✓"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={
                          Math.abs(
                            optimizedMeal.totalCarbs - targetMacros.carbs,
                          ) /
                            targetMacros.carbs <=
                          0.02
                            ? "bg-green-100 text-green-800"
                            : Math.abs(
                                optimizedMeal.totalCarbs - targetMacros.carbs,
                              ) /
                                targetMacros.carbs <=
                              0.05
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        Carbs: {optimizedMeal.totalCarbs}g
                        {Math.abs(optimizedMeal.totalCarbs - targetMacros.carbs) <= 0.5 && " ✓"}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={
                          Math.abs(optimizedMeal.totalFat - targetMacros.fat) /
                            targetMacros.fat <=
                          0.02
                            ? "bg-green-100 text-green-800"
                            : Math.abs(optimizedMeal.totalFat - targetMacros.fat) /
                                targetMacros.fat <=
                              0.05
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        Fat: {optimizedMeal.totalFat}g
                        {Math.abs(optimizedMeal.totalFat - targetMacros.fat) <= 0.5 && " ✓"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-md mb-3 text-primary">
                    Optimized Ingredients:
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Ingredient</th>
                          <th className="text-left py-2">Amount</th>
                          <th className="text-left py-2">Unit</th>
                          <th className="text-left py-2">Calories</th>
                          <th className="text-left py-2">Macros (P/C/F)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {optimizedMeal.ingredients.map(
                          (ing: any, i: number) => (
                            <tr key={i} className="border-b">
                              <td className="py-2 font-medium">{ing.name}</td>
                              <td className="py-2">{ing.amount}</td>
                              <td className="py-2">{ing.unit}</td>
                              <td className="py-2">{ing.calories}</td>
                              <td className="py-2 text-sm text-muted-foreground">
                                {ing.macrosString}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-md mb-2 text-primary">
                    Optimized Totals:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      Calories: {optimizedMeal.totalCalories} kcal
                    </Badge>
                    <Badge variant="outline">
                      Protein: {optimizedMeal.totalProtein}g
                    </Badge>
                    <Badge variant="outline">
                      Carbs: {optimizedMeal.totalCarbs}g
                    </Badge>
                    <Badge variant="outline">
                      Fat: {optimizedMeal.totalFat}g
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Click "Optimize to Target Macros" to start optimization
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OptimizedMealSuggestion;