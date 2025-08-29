// Advanced Meal Optimization using Multiple Algorithms
// DISABLED: Local optimization is disabled. All optimization must go through the external API.
// This file is kept for type definitions and utility functions only.

export interface Ingredient {
  name: string;
  cal: number; // Calories per gram
  prot: number; // Protein per gram
  carb: number; // Carbs per gram
  fat: number; // Fat per gram
}

export interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface OptimizationResult {
  feasible: boolean;
  achieved: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  ingredients: Record<string, number>;
  algorithm_used: string;
  computation_time: number;
  result: number;
  helpers_added?: string[];
  error?: string;
}

export interface MealSuggestionIngredient {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  macrosString?: string;
}

export interface OptimizedMealSuggestion {
  mealTitle: string;
  description: string;
  ingredients: MealSuggestionIngredient[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  instructions?: string;
}

// Enhanced nutrition database with research-based values (per 100g)
// This is kept for reference but not used for local optimization
const NUTRITION_DATABASE: Record<
  string,
  { cal: number; prot: number; carb: number; fat: number }
> = {
  // Protein Sources
  "chicken breast": { cal: 165, prot: 31.0, carb: 0, fat: 3.6 },
  "chicken breast grilled": { cal: 165, prot: 31.0, carb: 0, fat: 3.6 },
  "lean ground turkey": { cal: 189, prot: 27.0, carb: 0, fat: 8.3 },
  "ground beef": { cal: 250, prot: 26.0, carb: 0, fat: 15.0 },
  "ground beef lean": { cal: 200, prot: 26.0, carb: 0, fat: 10.0 },
  "egg whites": { cal: 52, prot: 10.9, carb: 0.7, fat: 0.2 },
  "greek yogurt non-fat": { cal: 59, prot: 10.0, carb: 3.6, fat: 0.4 },
  "cottage cheese low-fat": { cal: 72, prot: 12.4, carb: 4.3, fat: 1.0 },
  "whey protein powder": { cal: 412, prot: 85.0, carb: 4.0, fat: 5.0 },
  "fish cod": { cal: 82, prot: 18.0, carb: 0, fat: 0.7 },
  "tofu firm": { cal: 144, prot: 15.8, carb: 4.3, fat: 8.7 },

  // Carbohydrate Sources
  "brown rice raw": { cal: 370, prot: 7.9, carb: 77.0, fat: 2.9 },
  "white rice raw": { cal: 365, prot: 7.1, carb: 80.0, fat: 0.7 },
  "quinoa raw": { cal: 368, prot: 14.1, carb: 64.2, fat: 6.1 },
  "oats raw": { cal: 389, prot: 16.9, carb: 66.3, fat: 6.9 },
  "sweet potato raw": { cal: 86, prot: 1.6, carb: 20.1, fat: 0.1 },
  "pasta whole wheat raw": { cal: 348, prot: 14.6, carb: 71.0, fat: 2.5 },
  "bread whole wheat": { cal: 247, prot: 13.0, carb: 41.0, fat: 4.2 },
  "pita bread": { cal: 275, prot: 9.0, carb: 55.0, fat: 1.2 },
  "bread white": { cal: 265, prot: 9.0, carb: 49.0, fat: 3.2 },

  // Vegetables (low calorie, high volume)
  spinach: { cal: 23, prot: 2.9, carb: 3.6, fat: 0.4 },
  broccoli: { cal: 34, prot: 2.8, carb: 7.0, fat: 0.4 },
  "bell peppers": { cal: 31, prot: 1.0, carb: 7.0, fat: 0.3 },
  cucumber: { cal: 16, prot: 0.7, carb: 3.6, fat: 0.1 },
  lettuce: { cal: 15, prot: 1.4, carb: 2.9, fat: 0.2 },
  tomatoes: { cal: 18, prot: 0.9, carb: 3.9, fat: 0.2 },
  "tomato grilled": { cal: 20, prot: 1.0, carb: 4.0, fat: 0.2 },
  carrots: { cal: 41, prot: 0.9, carb: 9.6, fat: 0.2 },
  onion: { cal: 40, prot: 1.1, carb: 9.3, fat: 0.1 },
  "onion raw": { cal: 40, prot: 1.1, carb: 9.3, fat: 0.1 },
  "pepper grilled": { cal: 35, prot: 1.2, carb: 7.5, fat: 0.4 },

  // Healthy Fats
  "olive oil": { cal: 884, prot: 0, carb: 0, fat: 100 },
  avocado: { cal: 160, prot: 2.0, carb: 8.5, fat: 14.7 },
  almonds: { cal: 579, prot: 21.2, carb: 21.6, fat: 49.9 },
  walnuts: { cal: 654, prot: 15.2, carb: 13.7, fat: 65.2 },
  "chia seeds": { cal: 486, prot: 16.5, carb: 42.1, fat: 30.7 },

  // Fruits
  banana: { cal: 89, prot: 1.1, carb: 22.8, fat: 0.3 },
  "berries mixed": { cal: 57, prot: 0.7, carb: 14.5, fat: 0.3 },
  apple: { cal: 52, prot: 0.3, carb: 13.8, fat: 0.2 },
};

// DISABLED: Local optimization algorithms are disabled
// All optimization must go through the external API

// Main optimization function - DISABLED
export function optimizeMeal(
  ingredients: Ingredient[],
  targets: Targets,
): OptimizationResult {
  throw new Error(
    "Local meal optimization is disabled. Please use the external API through SingleMealOptimizationService.optimizeSingleMeal()",
  );
}

// Advanced optimization function - DISABLED
export function optimizeMealAdvanced(
  ingredients: Ingredient[],
  targets: Targets,
  mealName: string = "meal",
  algorithm: "ga" | "pso" | "sa" | "hybrid" = "hybrid",
): OptimizationResult {
  throw new Error(
    "Local meal optimization is disabled. Please use the external API through SingleMealOptimizationService.optimizeSingleMeal()",
  );
}

// Utility functions that are still useful for data conversion
function formatIngredientName(key: string): string {
  return key
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Convert AI meal suggestion to optimization format - DISABLED for local use
export function convertMealToIngredients(mealSuggestion: any): Ingredient[] {
  throw new Error(
    "Local meal optimization is disabled. Please use the external API through SingleMealOptimizationService.optimizeSingleMeal()",
  );
}

// Create targets from macro data - Still useful for API calls
export function createTargetsFromMacros(macroData: any): Targets {
  return {
    calories: macroData.calories || macroData.Calories || 0,
    protein: macroData.protein || macroData["Protein (g)"] || 0,
    carbs: macroData.carbs || macroData["Carbs (g)"] || 0,
    fat: macroData.fat || macroData["Fat (g)"] || 0,
  };
}

// Convert optimization result to meal format - DISABLED for local use
export function convertOptimizationToMeal(
  originalMeal: any,
  optimizationResult: OptimizationResult,
  ingredients: Ingredient[],
): OptimizedMealSuggestion {
  throw new Error(
    "Local meal optimization is disabled. Please use the external API through SingleMealOptimizationService.optimizeSingleMeal()",
  );
}

// All types are already exported above, no need for duplicate export
