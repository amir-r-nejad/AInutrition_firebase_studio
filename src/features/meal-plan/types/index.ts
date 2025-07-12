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
  customName: string;
  ingredients: {
    name: string;
    quantity: number | null;
    unit: string;
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
  }[];
  totalCalories: number | null;
  totalProtein: number | null;
  totalCarbs: number | null;
  totalFat: number | null;
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
    gender?: string | null;
    activityLevel?: string | null;
    dietGoal?: string | null;
    preferredDiet?: string | null;
    allergies: string[] | null;
    dispreferredIngredients: string[] | null;
    preferredIngredients: string[] | null;
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
  customName?: string;
  ingredients: AIServiceIngredient[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
};

export type AdjustMealIngredientsOutput = {
  adjustedMeal: AIServiceMeal;
  explanation: string;
};
