"use client";

import { MealOptimizationResponse } from "@/types/meal-optimization";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ShoppingCart,
  TrendingUp,
  Target,
  AlertTriangle,
} from "lucide-react";

interface MealOptimizationResultsProps {
  result: MealOptimizationResponse & {
    isFallback?: boolean;
    fallbackReason?: string;
  };
  onReset?: () => void;
}

export const MealOptimizationResults: React.FC<
  MealOptimizationResultsProps
> = ({ result, onReset }) => {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(2)}s`;
    return `${(seconds / 60).toFixed(2)}m`;
  };

  const isFallback =
    result.isFallback ||
    (typeof result.optimization_result.optimization_method === "string" &&
      result.optimization_result.optimization_method.includes("Fallback"));

  return (
    <div className="space-y-6">
      {/* Fallback Warning */}
      {isFallback && (
        <Card className="shadow-lg border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Using Fallback Optimization Service
            </CardTitle>
            <CardDescription className="text-orange-700">
              The external Meal Optimization API is currently unavailable. We&apos;re
              using our built-in fallback service to provide you with meal
              plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-orange-700">
                <strong>Reason:</strong>{" "}
                {result.fallbackReason || "External API unavailable"}
              </p>
              <p className="text-sm text-orange-700">
                <strong>Note:</strong> These results are generated using our
                local optimization algorithms. For the most advanced
                optimization, please try again when the external API is
                available.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Summary */}
      <Card
        className={`shadow-lg ${isFallback ? "border-orange-200 bg-orange-50/50" : "border-green-200 bg-green-50/50"}`}
      >
        <CardHeader>
          <CardTitle
            className={`text-xl font-semibold flex items-center gap-2 ${isFallback ? "text-orange-800" : "text-green-800"}`}
          >
            <CheckCircle className="h-5 w-5" />
            {isFallback
              ? "Fallback Optimization Complete!"
              : "Optimization Complete!"}
          </CardTitle>
          <CardDescription
            className={isFallback ? "text-orange-700" : "text-green-700"}
          >
            {isFallback
              ? "Your meal plan has been optimized using our local fallback service"
              : "Your meal plan has been optimized using advanced algorithms"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Badge variant="secondary" className="w-full justify-center">
                {result.optimization_result.target_achieved
                  ? "Target Achieved"
                  : "Target Not Met"}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Status</p>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="w-full justify-center">
                {formatTime(result.optimization_result.computation_time)}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Computation Time
              </p>
            </div>
            <div className="text-center">
              <Badge variant="secondary" className="w-full justify-center">
                {result.optimization_result.optimization_method}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Method</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Totals */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Daily Nutritional Totals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg bg-blue-50">
              <p className="text-2xl font-bold text-blue-600">
                {result.daily_totals.calories.toFixed(0)}
              </p>
              <p className="text-sm text-blue-700">Calories</p>
            </div>
            <div className="text-center p-3 border rounded-lg bg-green-50">
              <p className="text-2xl font-bold text-green-600">
                {result.daily_totals.protein.toFixed(1)}g
              </p>
              <p className="text-sm text-green-700">Protein</p>
            </div>
            <div className="text-center p-3 border rounded-lg bg-yellow-50">
              <p className="text-2xl font-bold text-yellow-600">
                {result.daily_totals.carbs.toFixed(1)}g
              </p>
              <p className="text-sm text-yellow-700">Carbs</p>
            </div>
            <div className="text-center p-3 border rounded-lg bg-red-50">
              <p className="text-2xl font-bold text-red-600">
                {result.daily_totals.fat.toFixed(1)}g
              </p>
              <p className="text-sm text-red-700">Fat</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Plans */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {isFallback ? "Fallback Meal Plans" : "Optimized Meal Plans"}
          </CardTitle>
          <CardDescription>
            {result.meal_plans.length} meal plans generated
            {isFallback && " (using local optimization algorithms)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.meal_plans.map((meal, index) => (
              <div key={index} className="border rounded-lg p-4 bg-muted/30">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-primary">
                    {meal.meal_time}
                  </h4>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {meal.total_calories.toFixed(0)} kcal
                    </Badge>
                    <Badge variant="outline">
                      {meal.total_protein.toFixed(1)}g P
                    </Badge>
                    <Badge variant="outline">
                      {meal.total_carbs.toFixed(1)}g C
                    </Badge>
                    <Badge variant="outline">
                      {meal.total_fat.toFixed(1)}g F
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Ingredients:</h5>
                    <div className="space-y-1">
                      {meal.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {typeof item.ingredient === "string"
                              ? item.ingredient
                              : (item.ingredient as { name: string }).name}
                          </span>
                          <span className="text-muted-foreground">
                            {item.quantity_grams}g
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">Nutrition per 100g:</h5>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>
                        Calories:{" "}
                        {typeof meal.items[0]?.ingredient === "object" && meal.items[0]?.ingredient !== null && "calories_per_100g" in meal.items[0].ingredient
                          ? (meal.items[0].ingredient as any).calories_per_100g || 0
                          : 0} kcal
                      </div>
                      <div>
                        Protein:{" "}
                        {typeof meal.items[0]?.ingredient === "object" &&
                        meal.items[0]?.ingredient !== null &&
                        "protein_per_100g" in meal.items[0].ingredient
                          ? (meal.items[0].ingredient as any).protein_per_100g || 0
                          : 0}g
                      </div>
                      <div>
                        Carbs:{" "}
                        {typeof meal.items[0]?.ingredient === "object" &&
                        meal.items[0]?.ingredient !== null &&
                        "carbs_per_100g" in meal.items[0].ingredient
                          ? (meal.items[0].ingredient as any).carbs_per_100g || 0
                          : 0}g
                      </div>
                      <div>
                        Fat:{" "}
                        {typeof meal.items[0]?.ingredient === "object" &&
                        meal.items[0]?.ingredient !== null &&
                        "fat_per_100g" in meal.items[0].ingredient
                          ? (meal.items[0].ingredient as any).fat_per_100g || 0
                          : 0}g
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shopping List */}
      {result.shopping_list && result.shopping_list.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Shopping List
            </CardTitle>
            <CardDescription>
              Ingredients you&apos;ll need to purchase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.shopping_list.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.category}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {item.quantity} {item.unit}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded"
                >
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Estimate */}
      {result.cost_estimate && result.cost_estimate > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Cost Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                ${result.cost_estimate.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Estimated total cost for ingredients
              </p>
              {isFallback && (
                <p className="text-xs text-orange-600 mt-1">
                  *Estimated using local pricing data
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        {onReset && (
          <Button onClick={onReset} variant="outline">
            Start Over
          </Button>
        )}
        <Button className="bg-primary hover:bg-primary/90">
          Save Meal Plan
        </Button>
        {isFallback && (
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-orange-200 text-orange-700 hover:bg-orange-50"
          >
            Retry External API
          </Button>
        )}
      </div>
    </div>
  );
};
