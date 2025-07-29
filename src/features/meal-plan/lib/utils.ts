import {
  daysOfWeek,
  defaultMacroPercentages,
  mealNames,
} from '@/lib/constants';
import {
  BaseProfileData,
  GeneratePersonalizedMealPlanInput,
  WeeklyMealPlan,
} from '@/lib/schemas';
import { DailyTargetsTypes, MealToOptimizeTypes } from '../types';
import { requiredFields } from './config';

export function mapProfileToMealPlanInput(
  profile: Record<string, any>
): GeneratePersonalizedMealPlanInput {
  const input = profile;
  Object.keys(input).forEach((key) => !input[key] && delete input[key]);

  return input as GeneratePersonalizedMealPlanInput;
}

export function getAdjustedMealInput(
  profileData: Partial<BaseProfileData>,
  dailyTargets: DailyTargetsTypes,
  mealToOptimize: MealToOptimizeTypes
) {
  let mealDistribution;
  const userMealDistributions = (profileData as any).meal_distributions;
  if (!userMealDistributions)
    mealDistribution = defaultMacroPercentages[mealToOptimize.name];
  else
    mealDistribution = userMealDistributions.filter(
      (meal: any) => meal.mealName === mealToOptimize.name
    )[0];

  const targetMacrosForMeal = {
    calories:
      dailyTargets.targetCalories! * (mealDistribution.calories_pct / 100),
    protein:
      dailyTargets.targetProtein! * (mealDistribution.calories_pct / 100),
    carbs: dailyTargets.targetCarbs! * (mealDistribution.calories_pct / 100),
    fat: dailyTargets.targetFat! * (mealDistribution.calories_pct / 100),
  };

  const preparedIngredients = mealToOptimize.ingredients.map((ing) => ({
    name: ing.name,
    quantity: Number(ing.quantity) || 0,
    unit: ing.unit,
    calories: Number(ing.calories) || 0,
    protein: Number(ing.protein) || 0,
    carbs: Number(ing.carbs) || 0,
    fat: Number(ing.fat) || 0,
  }));

  return {
    originalMeal: {
      name: mealToOptimize.name,
      custom_name: mealToOptimize.custom_name || '',
      ingredients: preparedIngredients,
      total_calories: Number(mealToOptimize.total_calories) || 0,
      total_protein: Number(mealToOptimize.total_protein) || 0,
      total_carbs: Number(mealToOptimize.total_carbs) || 0,
      total_fat: Number(mealToOptimize.total_fat) || 0,
    },
    targetMacros: targetMacrosForMeal,
    userProfile: {
      age: profileData.age ?? undefined,
      biological_sex: profileData.biological_sex ?? undefined,
      physical_activity_level: profileData.physical_activity_level ?? undefined,
      primary_diet_goal: profileData.primary_diet_goal ?? undefined,
      preferred_diet: profileData.preferred_diet ?? undefined,
      allergies: profileData.allergies ?? [],
      medical_conditions: profileData.medical_conditions ?? [],
      medications: profileData.medications ?? [],
    },
  };
}
export function getMissingProfileFields(
  profile: Partial<BaseProfileData>
): (keyof Partial<BaseProfileData>)[] {
  return requiredFields.filter((field) => !profile[field]);
}

export function generateInitialWeeklyPlan(): WeeklyMealPlan {
  return {
    days: daysOfWeek.map((day) => ({
      day_of_week: day,
      meals: mealNames.map((mealName) => ({
        name: mealName,
        custom_name: '',
        ingredients: [],
        total_calories: null,
        total_protein: null,
        total_carbs: null,
        total_fat: null,
      })),
    })),
  };
}
