"use client";

import React from "react";
import { SingleMealOptimizationResponse } from "@/types/meal-optimization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Calculator,
  ChevronRight,
} from "lucide-react";

interface SingleMealOptimizationResultsProps {
  result: SingleMealOptimizationResponse;
  onReset?: () => void;
}

export default function SingleMealOptimizationResults({
  result,
  onReset,
}: SingleMealOptimizationResultsProps) {
  // Safety check for undefined result
  if (!result) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">
          No optimization result available
        </p>
      </div>
    );
  }

  const isMock =
    result.optimization_result?.optimization_method?.includes("Mock") || false;
  const targetAchieved = result.optimization_result?.target_achieved || false;

  return (
    <div className="space-y-6">
      {/* Optimization Summary */}
      <Card
        className={
          isMock
            ? "border-orange-200 bg-orange-50"
            : "border-green-200 bg-green-50"
        }
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isMock ? (
              <AlertCircle className="h-5 w-5 text-orange-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            {isMock
              ? "Mock Single Meal Optimization (Testing Mode)"
              : "Single Meal Optimization"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={targetAchieved ? "default" : "destructive"}>
              {targetAchieved ? "Target Met" : "Target Not Met"}
            </Badge>
            <span className="text-sm text-muted-foreground">Status</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {result.optimization_result?.computation_time || 0}s
            </span>
            <span className="text-sm text-muted-foreground">
              Computation Time
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {result.optimization_result?.method || "Unknown"}
            </span>
            <span className="text-sm text-muted-foreground">Method</span>
          </div>

          {isMock && (
            <div className="mt-3 p-3 bg-orange-100 rounded-md">
              <p className="text-sm text-orange-800">
                Note: This is a fallback response. The real backend API was
                temporarily unavailable.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Meal Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl capitalize">Optimized Meal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ingredients Table */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">Ingredients:</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700">
                      Ingredient
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">
                      Amount (g)
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">
                      Calories
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">
                      Protein (g)
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">
                      Carbs (g)
                    </th>
                    <th className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700">
                      Fat (g)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.meal?.map((ingredient, index) => {
                    const quantity = ingredient.quantity_needed || 0;
                    const ingredientName =
                      ingredient.name || `Ingredient ${index + 1}`;

                    // Calculate nutritional values based on quantity_needed and per_100g values
                    const calories = Math.round(
                      (ingredient.calories_per_100g * quantity) / 100,
                    );
                    const protein =
                      Math.round(
                        ((ingredient.protein_per_100g * quantity) / 100) * 10,
                      ) / 10;
                    const carbs =
                      Math.round(
                        ((ingredient.carbs_per_100g * quantity) / 100) * 10,
                      ) / 10;
                    const fat =
                      Math.round(
                        ((ingredient.fat_per_100g * quantity) / 100) * 10,
                      ) / 10;

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2 font-medium">
                          {ingredientName}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-center">
                          {quantity.toFixed(1)}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-center">
                          {calories}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-center">
                          {protein}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-center">
                          {carbs}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-center">
                          {fat}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Ingredient Button */}
          <div className="pt-2">
            <button className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors">
              Add Ingredient
            </button>
          </div>

          {/* Calculated Totals */}
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-lg mb-3">Calculated Totals:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {(() => {
                    const totalCalories =
                      result.meal?.reduce((sum, ingredient) => {
                        const quantity = ingredient.quantity_needed || 0;
                        return (
                          sum + (ingredient.calories_per_100g * quantity) / 100
                        );
                      }, 0) || 0;
                    return Math.round(totalCalories);
                  })()}
                </div>
                <div className="text-sm text-muted-foreground">Calories</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(() => {
                    const totalProtein =
                      result.meal?.reduce((sum, ingredient) => {
                        const quantity = ingredient.quantity_needed || 0;
                        return (
                          sum + (ingredient.protein_per_100g * quantity) / 100
                        );
                      }, 0) || 0;
                    return Math.round(totalProtein * 10) / 10;
                  })()}
                  g
                </div>
                <div className="text-sm text-muted-foreground">Protein</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {(() => {
                    const totalCarbs =
                      result.meal?.reduce((sum, ingredient) => {
                        const quantity = ingredient.quantity_needed || 0;
                        return (
                          sum + (ingredient.carbs_per_100g * quantity) / 100
                        );
                      }, 0) || 0;
                    return Math.round(totalCarbs * 10) / 10;
                  })()}
                  g
                </div>
                <div className="text-sm text-muted-foreground">Carbs</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {(() => {
                    const totalFat =
                      result.meal?.reduce((sum, ingredient) => {
                        const quantity = ingredient.quantity_needed || 0;
                        return sum + (ingredient.fat_per_100g * quantity) / 100;
                      }, 0) || 0;
                    return Math.round(totalFat * 10) / 10;
                  })()}
                  g
                </div>
                <div className="text-sm text-muted-foreground">Fat</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Achievement */}
      <Card>
        <CardHeader>
          <CardTitle>Target Achievement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle
                className={`h-5 w-5 ${result.target_achievement?.calories ? "text-green-600" : "text-red-600"}`}
              />
              <span>Calories</span>
              <Badge
                variant={
                  result.target_achievement?.calories
                    ? "default"
                    : "destructive"
                }
                className="text-xs"
              >
                {result.target_achievement?.calories ? "Met" : "Not Met"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle
                className={`h-5 w-5 ${result.target_achievement?.protein ? "text-green-600" : "text-red-600"}`}
              />
              <span>Protein</span>
              <Badge
                variant={
                  result.target_achievement?.protein ? "default" : "destructive"
                }
                className="text-xs"
              >
                {result.target_achievement?.protein ? "Met" : "Not Met"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle
                className={`h-5 w-5 ${result.target_achievement?.carbs ? "text-green-600" : "text-red-600"}`}
              />
              <span>Carbs</span>
              <Badge
                variant={
                  result.target_achievement?.carbs ? "default" : "destructive"
                }
                className="text-xs"
              >
                {result.target_achievement?.carbs ? "Met" : "Not Met"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle
                className={`h-5 w-5 ${result.target_achievement?.fat ? "text-green-600" : "text-red-600"}`}
              />
              <span>Fat</span>
              <Badge
                variant={
                  result.target_achievement?.fat ? "default" : "destructive"
                }
                className="text-xs"
              >
                {result.target_achievement?.fat ? "Met" : "Not Met"}
              </Badge>
            </div>
          </div>

          {isMock && (
            <p className="mt-3 text-sm text-muted-foreground">
              This is a fallback response. The real backend API was temporarily
              unavailable.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {onReset && (
        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={onReset}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}
