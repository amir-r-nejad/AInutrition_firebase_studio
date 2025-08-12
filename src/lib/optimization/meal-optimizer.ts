// Meal optimization using linear programming
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

// Convert AI meal suggestion to optimization format
export function convertMealToIngredients(mealSuggestion: any): Ingredient[] {
  return mealSuggestion.ingredients.map((ing: any) => ({
    name: ing.name,
    cal: ing.calories / ing.amount, // Convert to per-gram values
    prot: ing.protein / ing.amount,
    carb: ing.carbs / ing.amount,
    fat: ing.fat / ing.amount,
  }));
}

// Create targets from macro splitter data
export function createTargetsFromMacros(macroData: any): Targets {
  return {
    calories: macroData.calories || macroData.Calories || 0,
    protein: macroData.protein || macroData["Protein (g)"] || 0,
    carbs: macroData.carbs || macroData["Carbs (g)"] || 0,
    fat: macroData.fat || macroData["Fat (g)"] || 0,
  };
}

// Optimize meal using linear programming
export function optimizeMeal(
  ingredients: Ingredient[],
  targets: Targets,
): OptimizationResult {
  // Set up the linear programming model
  const model: any = {
    optimize: "totalDev",
    opType: "min",
    constraints: {
      calories: { equal: targets.calories },
      protein: { equal: targets.protein },
      carbs: { equal: targets.carbs },
      fat: { equal: targets.fat },
    },
    variables: {},
    ints: {},
  };

  // Add ingredient contributions
  ingredients.forEach((ing) => {
    model.variables[ing.name] = {
      calories: ing.cal,
      protein: ing.prot,
      carbs: ing.carb,
      fat: ing.fat,
    };
  });

  // Add deviation variables (positive and negative for each macro)
  ["calories", "protein", "carbs", "fat"].forEach((macro) => {
    const posDev = `${macro}_pos`;
    const negDev = `${macro}_neg`;
    model.variables[posDev] = { [macro]: 1, totalDev: 1 };
    model.variables[negDev] = { [macro]: -1, totalDev: 1 };
    model.constraints[posDev] = { min: 0 };
    model.constraints[negDev] = { min: 0 };
  });

  // Solve the model using javascript-lp-solver
  try {
    // @ts-ignore - solver is loaded globally
    const results = window.solver.Solve(model);

    // Calculate achieved macros
    const achieved = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    ingredients.forEach((ing) => {
      const amount = results[ing.name] || 0;
      achieved.calories += amount * ing.cal;
      achieved.protein += amount * ing.prot;
      achieved.carbs += amount * ing.carb;
      achieved.fat += amount * ing.fat;
    });

    return {
      feasible: results.feasible,
      result: results.result,
      ingredients: results,
      achieved,
    };
  } catch (error) {
    console.error("Linear programming solver error:", error);
    return {
      feasible: false,
      result: 0,
      ingredients: {},
      achieved: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    };
  }
}

// Convert optimization result back to meal suggestion format
export function convertOptimizationToMeal(
  originalMeal: any,
  optimizationResult: OptimizationResult,
  ingredients: Ingredient[],
): OptimizedMealSuggestion {
  const optimizedIngredients: MealSuggestionIngredient[] = ingredients.map(
    (ing) => {
      const amount = optimizationResult.ingredients[ing.name] || 0;
      const calories = amount * ing.cal;
      const protein = amount * ing.prot;
      const carbs = amount * ing.carb;
      const fat = amount * ing.fat;

      return {
        name: ing.name,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
        unit: "g",
        calories: Math.round(calories * 100) / 100,
        protein: Math.round(protein * 100) / 100,
        carbs: Math.round(carbs * 100) / 100,
        fat: Math.round(fat * 100) / 100,
        macrosString: `${Math.round(calories)} cal, ${Math.round(protein)}g protein, ${Math.round(carbs)}g carbs, ${Math.round(fat)}g fat`,
      };
    },
  );

  return {
    mealTitle: originalMeal.mealTitle,
    description: `Optimized version of ${originalMeal.mealTitle} - adjusted ingredient quantities to match your exact macro targets using linear optimization.`,
    ingredients: optimizedIngredients,
    totalCalories: Math.round(optimizationResult.achieved.calories * 100) / 100,
    totalProtein: Math.round(optimizationResult.achieved.protein * 100) / 100,
    totalCarbs: Math.round(optimizationResult.achieved.carbs * 100) / 100,
    totalFat: Math.round(optimizationResult.achieved.fat * 100) / 100,
    instructions: originalMeal.instructions,
  };
}
