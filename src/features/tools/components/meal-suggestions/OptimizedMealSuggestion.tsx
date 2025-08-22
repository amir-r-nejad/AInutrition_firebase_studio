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
  optimizeMealIterative,
  convertMealToIngredients,
  createTargetsFromMacros,
  convertOptimizationToMeal,
} from "@/lib/optimization/meal-optimizer";

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

      // Use the new iterative optimizer (no external solver dependency)
      console.log("🚀 Calling optimizeMeal...");
      let result: any;
      try {
        result = optimizeMealIterative(ingredients, targets);
        console.log("✅ Optimization result:", result);
      } catch (error) {
        console.error("💥 optimizeMeal crashed:", error);
        throw error;
      }

      if (result.feasible) {
        // Convert the optimization result back to meal format
        console.log("🔄 Converting result back to meal...");
        const optimized = convertOptimizationToMeal(
          originalSuggestion,
          result,
          ingredients,
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
            "Meal has been optimized to match your exact macro targets using iterative helper selection.",
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
              advanced iterative helper selection.
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
                          0.05
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }
                      >
                        Calories: {optimizedMeal.totalCalories}g
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={
                          Math.abs(
                            optimizedMeal.totalProtein - targetMacros.protein,
                          ) /
                            targetMacros.protein <=
                          0.05
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }
                      >
                        Protein: {optimizedMeal.totalProtein}g
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={
                          Math.abs(
                            optimizedMeal.totalCarbs - targetMacros.carbs,
                          ) /
                            targetMacros.carbs <=
                          0.05
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }
                      >
                        Carbs: {optimizedMeal.totalCarbs}g
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={
                          Math.abs(optimizedMeal.totalFat - targetMacros.fat) /
                            targetMacros.fat <=
                          0.05
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }
                      >
                        Fat: {optimizedMeal.totalFat}g
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
