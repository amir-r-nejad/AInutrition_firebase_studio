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

export function mapProfileToMealPlanInput(data: any): GeneratePersonalizedMealPlanInput {
  // Extract meal data with proper validation
  const mealData = {
    target_daily_calories: data.target_daily_calories || data.custom_total_calories || 2000,
    target_protein_g: data.target_protein_g || data.custom_protein_g || 150,
    target_carbs_g: data.target_carbs_g || data.custom_carbs_g || 250,
    target_fat_g: data.target_fat_g || data.custom_fat_g || 67,
  };

  console.log('Mapping profile to meal plan input:', {
    mealData,
    mealDistributions: data.meal_distributions,
    preferences: {
      diet: data.preferred_diet,
      allergies: data.allergies,
      disliked: data.dispreferrred_ingredients,
      preferred: data.preferred_ingredients,
    }
  });

  return {
    age: data.age || 25,
    biological_sex: data.biological_sex || 'Male',
    height_cm: data.height_cm || 175,
    current_weight_kg: data.current_weight_kg || 70,
    target_weight_kg: data.target_weight_kg || data.current_weight_kg || 70,
    physical_activity_level: data.physical_activity_level || 'Moderate',
    primary_diet_goal: data.primary_diet_goal || 'Maintain Weight',
    preferred_diet: data.preferred_diet || 'Standard',
    allergies: data.allergies || [],
    medical_conditions: data.medical_conditions || [],
    dispreferrred_ingredients: data.dispreferrred_ingredients || [],
    preferred_ingredients: data.preferred_ingredients || [],
    meal_data: mealData,
    meal_distributions: data.meal_distributions || null, // Include macro splitter data
  };
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