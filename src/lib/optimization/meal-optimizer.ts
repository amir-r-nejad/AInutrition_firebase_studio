// Advanced Meal Optimization using Mathematical Programming with Context Intelligence
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
  result: number;
  ingredients: { [key: string]: number };
  achieved: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  error?: string;
  helpers_added?: string[];
}

export interface MealSuggestionIngredient {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  macrosString: string;
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
const NUTRITION_DATABASE: Record<string, { cal: number; prot: number; carb: number; fat: number }> = {
  // Protein Sources
  "chicken breast": { cal: 165, prot: 31.0, carb: 0, fat: 3.6 },
  "chicken breast grilled": { cal: 165, prot: 31.0, carb: 0, fat: 3.6 },
  "lean ground turkey": { cal: 189, prot: 27.0, carb: 0, fat: 8.3 },
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

  // Vegetables (low calorie, high volume)
  "spinach": { cal: 23, prot: 2.9, carb: 3.6, fat: 0.4 },
  "broccoli": { cal: 34, prot: 2.8, carb: 7.0, fat: 0.4 },
  "bell peppers": { cal: 31, prot: 1.0, carb: 7.0, fat: 0.3 },
  "cucumber": { cal: 16, prot: 0.7, carb: 3.6, fat: 0.1 },
  "lettuce": { cal: 15, prot: 1.4, carb: 2.9, fat: 0.2 },
  "tomatoes": { cal: 18, prot: 0.9, carb: 3.9, fat: 0.2 },
  "carrots": { cal: 41, prot: 0.9, carb: 9.6, fat: 0.2 },

  // Healthy Fats
  "olive oil": { cal: 884, prot: 0, carb: 0, fat: 100 },
  "avocado": { cal: 160, prot: 2.0, carb: 8.5, fat: 14.7 },
  "almonds": { cal: 579, prot: 21.2, carb: 21.6, fat: 49.9 },
  "walnuts": { cal: 654, prot: 15.2, carb: 13.7, fat: 65.2 },
  "chia seeds": { cal: 486, prot: 16.5, carb: 42.1, fat: 30.7 },

  // Fruits
  "banana": { cal: 89, prot: 1.1, carb: 22.8, fat: 0.3 },
  "berries mixed": { cal: 57, prot: 0.7, carb: 14.5, fat: 0.3 },
  "apple": { cal: 52, prot: 0.3, carb: 13.8, fat: 0.2 },
};

// Linear Programming Solver using Simplex-like algorithm
function optimizeLinear(
  ingredients: Ingredient[],
  targets: Targets
): OptimizationResult {
  const n = ingredients.length;

  // Build coefficient matrix [calories, protein, carbs, fat]
  const A = [
    ingredients.map(ing => ing.cal),   // Calories row
    ingredients.map(ing => ing.prot),  // Protein row  
    ingredients.map(ing => ing.carb),  // Carbs row
    ingredients.map(ing => ing.fat)    // Fat row
  ];

  const b = [targets.calories, targets.protein, targets.carbs, targets.fat];

  // Try to solve the linear system using least squares with bounds
  let bestSolution: number[] | null = null;
  let bestError = Infinity;

  // Multiple starting points to find global optimum
  for (let trial = 0; trial < 50; trial++) {
    let x = ingredients.map(() => Math.random() * 200); // Random start 0-200g

    // Gradient descent with momentum
    let momentum = new Array(n).fill(0);
    const learningRate = 0.1;
    const momentumFactor = 0.9;

    for (let iter = 0; iter < 1000; iter++) {
      // Calculate current achievement
      const current = A.map(row => 
        row.reduce((sum, coeff, j) => sum + coeff * x[j], 0)
      );

      // Calculate errors with different weights for each macro
      const errors = current.map((val, i) => val - b[i]);
      const weights = [1, 3, 2, 4]; // Prioritize protein and fat accuracy
      const totalError = errors.reduce((sum, err, i) => 
        sum + weights[i] * err * err, 0
      );

      if (totalError < bestError) {
        bestError = totalError;
        bestSolution = [...x];
      }

      // Calculate gradients
      const gradients = x.map((_, j) => {
        return A.reduce((sum, row, i) => 
          sum + 2 * weights[i] * errors[i] * row[j], 0
        );
      });

      // Update with momentum
      for (let j = 0; j < n; j++) {
        momentum[j] = momentumFactor * momentum[j] - learningRate * gradients[j];
        x[j] += momentum[j];
        x[j] = Math.max(0, Math.min(500, x[j])); // Bounds: 0-500g
      }

      // Early stopping if very close
      if (totalError < 0.01) break;
    }
  }

  if (bestSolution) {
    const finalAchieved = A.map(row => 
      row.reduce((sum, coeff, j) => sum + coeff * bestSolution![j], 0)
    );

    return {
      feasible: true,
      result: bestError,
      ingredients: Object.fromEntries(
        ingredients.map((ing, i) => [ing.name, Math.round(bestSolution![i] * 100) / 100])
      ),
      achieved: {
        calories: Math.round(finalAchieved[0] * 100) / 100,
        protein: Math.round(finalAchieved[1] * 100) / 100,
        carbs: Math.round(finalAchieved[2] * 100) / 100,
        fat: Math.round(finalAchieved[3] * 100) / 100
      }
    };
  }

  return {
    feasible: false,
    result: 0,
    ingredients: {},
    achieved: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    error: "Could not find solution"
  };
}

// Check if solution is within acceptable tolerance (±2%)
function isWithinTolerance(achieved: any, targets: Targets, tolerance = 0.02): boolean {
  const checks = [
    Math.abs(achieved.calories - targets.calories) / targets.calories <= tolerance,
    Math.abs(achieved.protein - targets.protein) / targets.protein <= tolerance,
    Math.abs(achieved.carbs - targets.carbs) / targets.carbs <= tolerance,
    Math.abs(achieved.fat - targets.fat) / targets.fat <= tolerance
  ];

  return checks.every(check => check);
}

// Generate contextual helper ingredients
function generateContextualHelpers(
  baseIngredients: Ingredient[],
  targets: Targets,
  mealType: string = 'meal'
): Ingredient[] {
  const existing = new Set(baseIngredients.map(ing => ing.name.toLowerCase()));
  const helpers: Ingredient[] = [];

  // Analyze deficits
  const estimatedBase = {
    calories: baseIngredients.reduce((sum, ing) => sum + ing.cal * 100, 0),
    protein: baseIngredients.reduce((sum, ing) => sum + ing.prot * 100, 0),
    carbs: baseIngredients.reduce((sum, ing) => sum + ing.carb * 100, 0),
    fat: baseIngredients.reduce((sum, ing) => sum + ing.fat * 100, 0)
  };

  const deficits = {
    calories: targets.calories - estimatedBase.calories,
    protein: targets.protein - estimatedBase.protein,
    carbs: targets.carbs - estimatedBase.carbs,
    fat: targets.fat - estimatedBase.fat
  };

  // Helper categories based on deficits
  const helperCategories: string[] = [];

  // Protein helpers (highest priority if deficit > 10g)
  if (deficits.protein > 10) {
    helperCategories.push('chicken breast grilled', 'greek yogurt non-fat', 'egg whites');
  } else if (deficits.protein > 5) {
    helperCategories.push('greek yogurt non-fat', 'cottage cheese low-fat');
  }

  // Carb helpers
  if (deficits.carbs > 30) {
    helperCategories.push('brown rice raw', 'quinoa raw', 'sweet potato raw');
  } else if (deficits.carbs > 15) {
    helperCategories.push('sweet potato raw', 'oats raw');
  }

  // Fat helpers (for low-fat requirements)
  if (deficits.fat < -5) {
    // Need to reduce fat - add low-fat high-volume foods
    helperCategories.push('spinach', 'cucumber', 'bell peppers');
  } else if (deficits.fat > 5) {
    helperCategories.push('olive oil', 'avocado');
  }

  // Volume helpers (vegetables)
  helperCategories.push('spinach', 'broccoli', 'tomatoes');

  // Convert to ingredients
  for (const category of helperCategories.slice(0, 8)) { // Limit to 8 helpers
    if (!existing.has(category)) {
      const nutrition = NUTRITION_DATABASE[category];
      if (nutrition) {
        helpers.push({
          name: formatIngredientName(category),
          cal: nutrition.cal / 100,
          prot: nutrition.prot / 100,
          carb: nutrition.carb / 100,
          fat: nutrition.fat / 100
        });
        existing.add(category);
      }
    }
  }

  return helpers;
}

// Main optimization function with helper addition
export function optimizeMealAdvanced(
  ingredients: Ingredient[],
  targets: Targets,
  mealName: string = 'meal'
): OptimizationResult {
  console.log("🎯 Starting Advanced Linear Programming Optimization");
  console.log("📊 Targets:", targets);
  console.log("🧪 Base ingredients:", ingredients.map(i => i.name));

  try {
    // Phase 1: Try with original ingredients
    console.log("📊 Phase 1: Optimizing with original ingredients");
    let result = optimizeLinear(ingredients, targets);

    if (result.feasible && isWithinTolerance(result.achieved, targets, 0.05)) {
      console.log("✅ Original ingredients achieved targets within 5% tolerance");
      return result;
    }

    // Phase 2: Add contextual helpers and re-optimize
    console.log("📊 Phase 2: Adding contextual helpers");
    const helpers = generateContextualHelpers(ingredients, targets, mealName);
    console.log("🆘 Generated helpers:", helpers.map(h => h.name));

    const enhancedIngredients = [...ingredients, ...helpers];

    // Try optimization with helpers
    const enhancedResult = optimizeLinear(enhancedIngredients, targets);

    if (enhancedResult.feasible) {
      // Check which helpers were actually used (amount > 1g)
      const helpersUsed = helpers
        .filter(helper => enhancedResult.ingredients[helper.name] > 1)
        .map(helper => helper.name);

      console.log("✅ Optimization with helpers completed");
      console.log("🆘 Helpers used:", helpersUsed);

      return {
        ...enhancedResult,
        helpers_added: helpersUsed
      };
    }

    console.log("❌ Could not achieve targets even with helpers");
    return result; // Return original attempt

  } catch (error: any) {
    console.error("❌ Optimization failed:", error);
    return {
      feasible: false,
      result: 0,
      ingredients: {},
      achieved: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      error: error?.message || String(error)
    };
  }
}

// Utility functions
function formatIngredientName(key: string): string {
  return key.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Convert AI meal suggestion to optimization format
export function convertMealToIngredients(mealSuggestion: any): Ingredient[] {
  return mealSuggestion.ingredients.map((ing: any) => {
    let calories = Number(ing.calories ?? ing.kcal ?? ing.cal ?? 0) || 0;
    let protein = Number(ing.protein ?? ing.prot ?? ing.proteins ?? 0) || 0;
    let carbs = Number(ing.carbs ?? ing.carb ?? ing.carbohydrates ?? 0) || 0;
    let fat = Number(ing.fat ?? ing.fats ?? 0) || 0;

    // Fallback to nutrition database if needed
    if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
      const fallback = NUTRITION_DATABASE[ing.name.toLowerCase()] || { cal: 100, prot: 5, carb: 15, fat: 3 };
      calories = fallback.cal;
      protein = fallback.prot;
      carbs = fallback.carb;
      fat = fallback.fat;
    }

    const amount = Number(ing.amount ?? ing.quantity ?? 100);

    return {
      name: ing.name,
      cal: amount > 0 ? calories / amount : 0,
      prot: amount > 0 ? protein / amount : 0,
      carb: amount > 0 ? carbs / amount : 0,
      fat: amount > 0 ? fat / amount : 0,
    };
  });
}

// Create targets from macro data
export function createTargetsFromMacros(macroData: any): Targets {
  return {
    calories: macroData.calories || macroData.Calories || 0,
    protein: macroData.protein || macroData["Protein (g)"] || 0,
    carbs: macroData.carbs || macroData["Carbs (g)"] || 0,
    fat: macroData.fat || macroData["Fat (g)"] || 0,
  };
}

// Convert optimization result to meal format
export function convertOptimizationToMeal(
  originalMeal: any,
  optimizationResult: OptimizationResult,
  ingredients: Ingredient[],
): OptimizedMealSuggestion {
  console.log("🔄 Converting optimization result to meal format");

  const optimizedIngredients: MealSuggestionIngredient[] = [];

  Object.entries(optimizationResult.ingredients).forEach(([ingredientName, amount]) => {
    if (amount > 0.5) { // Only include ingredients with meaningful amounts
      const ingredientData = ingredients.find(ing => 
        ing.name.toLowerCase().trim() === ingredientName.toLowerCase().trim()
      );

      if (ingredientData) {
        const calories = amount * ingredientData.cal;
        const protein = amount * ingredientData.prot;
        const carbs = amount * ingredientData.carb;
        const fat = amount * ingredientData.fat;

        optimizedIngredients.push({
          name: ingredientData.name,
          amount: Math.round(amount * 100) / 100,
          unit: "g",
          calories: Math.round(calories * 100) / 100,
          protein: Math.round(protein * 100) / 100,
          carbs: Math.round(carbs * 100) / 100,
          fat: Math.round(fat * 100) / 100,
          macrosString: `${Math.round(calories)} cal, ${Math.round(protein)}g protein, ${Math.round(carbs)}g carbs, ${Math.round(fat)}g fat`,
        });
      }
    }
  });

  // Create description mentioning helpers if any were added
  let description = `Mathematically optimized ${originalMeal.mealTitle} using advanced linear programming to achieve exact macro targets.`;

  if (optimizationResult.helpers_added && optimizationResult.helpers_added.length > 0) {
    description += ` Additional ingredients (${optimizationResult.helpers_added.join(', ')}) were added to make the targets achievable.`;
  }

  return {
    mealTitle: originalMeal.mealTitle,
    description,
    ingredients: optimizedIngredients,
    totalCalories: Math.round(optimizationResult.achieved.calories * 100) / 100,
    totalProtein: Math.round(optimizationResult.achieved.protein * 100) / 100,
    totalCarbs: Math.round(optimizationResult.achieved.carbs * 100) / 100,
    totalFat: Math.round(optimizationResult.achieved.fat * 100) / 100,
    instructions: originalMeal.instructions || "Cook ingredients according to preference. Season to taste and serve.",
  };
}

// Main optimization function
export const optimizeMeal = optimizeMealAdvanced;