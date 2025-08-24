export interface RAGIngredient {
  name: string;
  amount: string | number; // Can be string or number
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  macrosString?: string; // Optional macros string
}

export interface RAGSuggestion {
  mealTitle?: string;
  description?: string;
  ingredients: RAGIngredient[];
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  instructions?: string; // Add instructions property
}

export interface RAGResponse {
  suggestions: RAGSuggestion[];
  success: boolean;
  message?: string;
}

export interface TargetMacros {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface UserPreferences {
  dietary_restrictions: string[];
  allergies: string[];
  preferred_cuisines: string[];
  calorie_preference: 'low' | 'moderate' | 'high';
  protein_preference: 'low' | 'moderate' | 'high';
  carb_preference: 'low' | 'moderate' | 'high';
  fat_preference: 'low' | 'moderate' | 'high';
}

export interface MealOptimizationRequest {
  rag_response: RAGResponse;
  target_macros: TargetMacros;
  user_preferences: UserPreferences;
  user_id: string;
}

export interface OptimizationResult {
  success: boolean;
  target_achieved: boolean;
  optimization_method: string;
  objective_value: number;
  constraints_violated: string[];
  computation_time: number;
}

export interface MealPlanItem {
  ingredient: {
    id: string;
    name: string;
    category: string;
    calories_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
  };
  quantity_grams: number;
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
  carbohydrates: number;
  fat: number;
}

export interface ShoppingListItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
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

export interface SingleMealOptimizationResponse {
  optimization_result: OptimizationResult;
  meal: {
    meal_time: string;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    items: MealPlanItem[];
  };
  target_achievement: {
    calories_achieved: boolean;
    protein_achieved: boolean;
    carbs_achieved: boolean;
    fat_achieved: boolean;
    notes: string;
  };
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
