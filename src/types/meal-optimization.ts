export interface RAGIngredient {
  name: string;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  calories_per_100g: number;
  quantity_needed: number;
}

export interface RAGSuggestion {
  ingredients: RAGIngredient[];
}

export interface RAGResponse {
  suggestions: RAGSuggestion[];
  success: boolean;
  message?: string;
}

export interface TargetMacros {
  calories: number;
  protein: number;
  carbs: number; // Changed from carbohydrates to carbs
  fat: number;
}

export interface UserPreferences {
  diet_type: string;
  allergies: string[];
  preferences: string[];
}

export interface MealOptimizationRequest {
  rag_response: RAGResponse;
  target_macros: TargetMacros;
  user_preferences: UserPreferences;
  user_id: string;
}

export interface OptimizationResult {
  success: boolean;
  target_achieved?: boolean; // Optional in backend response
  method: string; // Actual field name in backend response
  computation_time: number;
  objective_value?: number; // Optional in backend response
  constraints_violated?: string[]; // Optional in backend response
}

export interface MealPlanItem {
  // Backend sends nutritional data at top level, not nested in ingredient
  ingredient: string; // Backend sends ingredient name as string
  quantity_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlan {
  meal_time: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  items: MealPlanItem[];
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number; // Changed from carbohydrates to carbs
  fat: number;
}

export interface ShoppingListItem {
  ingredient: string; // Backend sends ingredient name as string
  quantity: string; // Backend sends quantity as string (e.g., "41.4g")
  estimated_cost?: string; // Optional estimated cost from backend
  name?: string; // Keep for backward compatibility
  unit?: string; // Keep for backward compatibility
  category?: string; // Keep for backward compatibility
}

export interface MealOptimizationResponse {
  optimization_result: OptimizationResult;
  meal_plans: MealPlan[];
  daily_totals: DailyTotals;
  recommendations: string[];
  cost_estimate: number;
  shopping_list: ShoppingListItem[];
  rag_enhancement: {
    original_macros: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    added_ingredients: RAGIngredient[];
    enhancement_notes: string;
  };
  user_id: string;
}

export interface SingleMealOptimizationRequest {
  rag_response: RAGResponse;
  target_macros: TargetMacros;
  user_preferences: UserPreferences;
  user_id: string;
  meal_type: string; // e.g., "lunch", "breakfast", "dinner"
}

// External API response format (what the backend actually returns)
export interface ExternalSingleMealOptimizationResponse {
  user_id: string;
  success: boolean;
  optimization_result: {
    success: boolean;
    method: string;
    computation_time: number;
  };
  meal: Array<{
    name: string;
    quantity_needed: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
    calories_per_100g: number;
  }>;
  nutritional_totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  target_achievement: {
    calories: boolean;
    protein: boolean;
    carbs: boolean;
    fat: boolean;
    overall: boolean;
  };
}

// Frontend response format (what the frontend components expect)
export interface SingleMealOptimizationResponse {
  user_id: string;
  success: boolean;
  optimization_result: OptimizationResult;
  meal: RAGIngredient[];
  nutritional_totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  target_achievement: {
    calories: boolean;
    protein: boolean;
    carbs: boolean;
    fat: boolean;
    overall: boolean;
  };
}
