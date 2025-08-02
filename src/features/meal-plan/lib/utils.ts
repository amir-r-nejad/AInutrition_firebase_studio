import {
  daysOfWeek,
  defaultMacroPercentages,
  mealNames,
} from '@/lib/constants';
import {
  BaseProfileData,
  GeneratePersonalizedMealPlanInput,
  WeeklyMealPlan,
  UserPlanType,
  MealPlans,
} from '@/lib/schemas';
import { DailyTargetsTypes, MealToOptimizeTypes } from '../types';
import { requiredFields } from './config';

export function mapProfileToMealPlanInput(data: {
  meal_data?: MealPlans["meal_data"];
  target_daily_calories?: number;
  target_protein_g?: number;
  target_carbs_g?: number;
  target_fat_g?: number;
  meal_distributions?: BaseProfileData["meal_distributions"];
  preferred_diet?: string;
  allergies?: string[];
  dispreferrred_ingredients?: string[];
  preferred_ingredients?: string[];
  medical_conditions?: string[];
} & Partial<BaseProfileData> & Partial<UserPlanType>): GeneratePersonalizedMealPlanInput {

  // Extract meal data with proper fallbacks
  const mealData = {
    target_daily_calories: data.target_daily_calories || data.custom_total_calories || 2000,
    target_protein_g: data.target_protein_g || data.custom_protein_g || 150,
    target_carbs_g: data.target_carbs_g || data.custom_carbs_g || 200,
    target_fat_g: data.target_fat_g || data.custom_fat_g || 65,
  };

  // Get meal distributions from macro splitter
  const mealDistributions = data.meal_distributions || [
    { mealName: "Breakfast", calories_pct: 25, protein_pct: 25, carbs_pct: 25, fat_pct: 25 },
    { mealName: "Morning Snack", calories_pct: 10, protein_pct: 10, carbs_pct: 10, fat_pct: 10 },
    { mealName: "Lunch", calories_pct: 30, protein_pct: 30, carbs_pct: 30, fat_pct: 30 },
    { mealName: "Afternoon Snack", calories_pct: 10, protein_pct: 10, carbs_pct: 10, fat_pct: 10 },
    { mealName: "Dinner", calories_pct: 20, protein_pct: 20, carbs_pct: 20, fat_pct: 20 },
    { mealName: "Evening Snack", calories_pct: 5, protein_pct: 5, carbs_pct: 5, fat_pct: 5 },
  ];

  // Extract user preferences - map primary_diet_goal to preferred_diet correctly
  let mappedDiet = "Standard";
  if (data.preferred_diet) {
    // If preferred_diet is explicitly set, use it
    mappedDiet = data.preferred_diet;
  } else if (data.primary_diet_goal) {
    // Map primary_diet_goal to valid preferred_diet values
    switch (data.primary_diet_goal) {
      case "fat_loss":
      case "muscle_gain":
      case "recomp":
        mappedDiet = "Standard"; // Default to Standard for all diet goals
        break;
      default:
        mappedDiet = "Standard";
    }
  }

  const preferences = {
    diet: mappedDiet,
    allergies: data.allergies || [],
    disliked: data.dispreferrred_ingredients || [],
    preferred: data.preferred_ingredients || [],
  };

  console.log("Mapping profile to meal plan input:", {
    mealData,
    mealDistributions,
    preferences,
  });

  return {
    // Profile data with defaults
    age: data.age || 30,
    biological_sex: data.biological_sex || "other",
    height_cm: data.height_cm || 170,
    current_weight_kg: data.current_weight_kg || 70,
    target_weight_kg: data.target_weight_kg || 70,
    physical_activity_level: data.physical_activity_level || "moderate",
    primary_diet_goal: data.primary_diet_goal || "fat_loss",
    
    // Meal and preference data
    meal_data: mealData,
    meal_distributions: mealDistributions,
    preferred_diet: preferences.diet,
    allergies: preferences.allergies,
    dispreferrred_ingredients: preferences.disliked,
    preferred_ingredients: preferences.preferred,
    medical_conditions: data.medical_conditions || [],
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