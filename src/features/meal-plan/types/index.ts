import { Meal } from '@/lib/schemas';

export type EditMealDialogProps = {
  meal: Meal;
  onSave: (updatedMeal: Meal) => void;
  onClose: () => void;
};

export type DailyTargetsTypes = {
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  bmr?: number;
  tdee?: number;
};

export type MealToOptimizeTypes = {
  name: string;
  custom_name: string;
  ingredients: {
    name: string;
    quantity: number | null;
    unit: string;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  }[];
  total_calories: number | null;
  total_protein: number | null;
  total_carbs: number | null;
  total_fat: number | null;
  id?: string | undefined;
};

export interface AdjustMealIngredientsInput {
  originalMeal: AIServiceMeal;
  targetMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  userProfile: {
    age?: number | null;
    biological_sex?: string | null;
    physical_activity_level?: string | null;
    primary_diet_goal?: string | null;
    preferred_diet?: string | null;
    allergies?: string[];
    dispreferrred_ingredients?: string[];
    preferred_ingredients?: string[];
  };
}

export type AIServiceIngredient = {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type AIServiceMeal = {
  name: string;
  custom_name?: string;
  ingredients: AIServiceIngredient[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
};

export type AdjustMealIngredientsOutput = {
  adjustedMeal: AIServiceMeal;
  explanation: string;
};
