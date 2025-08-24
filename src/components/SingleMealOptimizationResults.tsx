'use client';

import React from 'react';
import { SingleMealOptimizationResponse } from '@/types/meal-optimization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Calculator } from 'lucide-react';

interface SingleMealOptimizationResultsProps {
  result: SingleMealOptimizationResponse;
  onReset?: () => void;
}

export default function SingleMealOptimizationResults({
  result,
  onReset,
}: SingleMealOptimizationResultsProps) {
  const isMock = result.optimization_result.optimization_method.includes('Mock');
  const targetAchieved = result.optimization_result.target_achieved;

  return (
    <div className="space-y-6">
      {/* Optimization Summary */}
      <Card className={isMock ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isMock ? (
              <AlertCircle className="h-5 w-5 text-orange-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            {isMock ? 'Mock Single Meal Optimization (Testing Mode)' : 'Single Meal Optimization'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={targetAchieved ? 'default' : 'destructive'}>
              {targetAchieved ? 'Target Met' : 'Target Not Met'}
            </Badge>
            <span className="text-sm text-muted-foreground">Status</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {result.optimization_result.computation_time}s
            </span>
            <span className="text-sm text-muted-foreground">Computation Time</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {result.optimization_result.optimization_method}
            </span>
            <span className="text-sm text-muted-foreground">Method</span>
          </div>

          {isMock && (
            <div className="mt-3 p-3 bg-orange-100 rounded-md">
              <p className="text-sm text-orange-800">
                Note: This is a mock response for testing purposes. The external API endpoint /optimize-single-meal needs to be implemented on your backend for production use.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Meal Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl capitalize">{result.meal.meal_time}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ingredients List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">Ingredients:</h4>
            {result.meal.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h5 className="font-medium text-lg">{item.ingredient.name}</h5>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity_grams}g
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    (Total for this quantity)
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-sm font-medium">
                    {Math.round((item.ingredient.calories_per_100g * item.quantity_grams) / 100)} cal
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((item.ingredient.protein_per_100g * item.quantity_grams) / 100 * 10) / 10} protein
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((item.ingredient.carbs_per_100g * item.quantity_grams) / 100 * 10) / 10} carbohydrate
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((item.ingredient.fat_per_100g * item.quantity_grams) / 100 * 10) / 10} fat
                  </div>
                </div>
              </div>
            ))}
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
                  {Math.round(result.meal.total_calories)}
                </div>
                <div className="text-sm text-muted-foreground">Calories</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(result.meal.total_protein * 10) / 10}g
                </div>
                <div className="text-sm text-muted-foreground">Protein</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(result.meal.total_carbs * 10) / 10}g
                </div>
                <div className="text-sm text-muted-foreground">Carbs</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {Math.round(result.meal.total_fat * 10) / 10}g
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
              <CheckCircle className={`h-5 w-5 ${result.target_achievement.calories_achieved ? 'text-green-600' : 'text-red-600'}`} />
              <span>Calories</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-5 w-5 ${result.target_achievement.protein_achieved ? 'text-green-600' : 'text-red-600'}`} />
              <span>Protein</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-5 w-5 ${result.target_achievement.carbs_achieved ? 'text-green-600' : 'text-red-600'}`} />
              <span>Carbs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-5 w-5 ${result.target_achievement.fat_achieved ? 'text-green-600' : 'text-red-600'}`} />
              <span>Fat</span>
            </div>
          </div>
          {isMock && (
            <p className="mt-3 text-sm text-muted-foreground">
              This is a mock response for testing. Please implement the external API endpoint for production use.
            </p>
          )}
        </CardContent>
      </Card>

      {/* RAG Enhancement Details */}
      <Card>
        <CardHeader>
          <CardTitle>RAG Enhancement Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            How the original meal suggestions were enhanced to meet your macro targets
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h5 className="font-medium mb-2">Original Macros:</h5>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Calories:</span>
                <div className="font-medium">{Math.round(result.rag_enhancement.original_macros.calories)} kcal</div>
              </div>
              <div>
                <span className="text-muted-foreground">Protein:</span>
                <div className="font-medium">{Math.round(result.rag_enhancement.original_macros.protein * 10) / 10}g</div>
              </div>
              <div>
                <span className="text-muted-foreground">Carbs:</span>
                <div className="font-medium">{Math.round(result.rag_enhancement.original_macros.carbs * 10) / 10}g</div>
              </div>
              <div>
                <span className="text-muted-foreground">Fat:</span>
                <div className="font-medium">{Math.round(result.rag_enhancement.original_macros.fat * 10) / 10}g</div>
              </div>
            </div>
          </div>

          {result.rag_enhancement.added_ingredients.length > 0 && (
            <div>
              <h5 className="font-medium mb-2">Added Ingredients:</h5>
              <div className="space-y-2">
                {result.rag_enhancement.added_ingredients.map((ingredient, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{ingredient.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {ingredient.amount}{ingredient.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h5 className="font-medium mb-2">Enhancement Notes:</h5>
            <p className="text-sm text-muted-foreground">
              {isMock ? 'Mock enhancement - no actual optimization performed' : result.rag_enhancement.enhancement_notes}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Shopping List */}
      <Card>
        <CardHeader>
          <CardTitle>Shopping List</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ingredients you'll need to purchase for this meal
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {result.shopping_list.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 border rounded">
                <span className="font-medium">{item.name}</span>
                <div className="text-sm text-muted-foreground">
                  {item.quantity} {item.unit}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          {isMock ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• External API endpoint /optimize-single-meal needs to be implemented on your backend</p>
              <p>• This mock response shows the expected data structure</p>
              <p>• For production use, implement proper ingredient optimization algorithms</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {result.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Cost Estimate */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Estimate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${result.cost_estimate.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Estimated cost for this meal
          </p>
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
