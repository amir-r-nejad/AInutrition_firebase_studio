import { type GeneratePersonalizedMealPlanInput } from '@/ai/flows/generate-meal-plan';
import {
  daysOfWeek,
  defaultMacroPercentages,
  mealNames,
} from '@/lib/constants';
import { BaseProfileData, WeeklyMealPlan } from '@/lib/schemas';
import { DailyTargetsTypes, MealToOptimizeTypes } from '../types';
import { requiredFields } from './config';

export function mapProfileToMealPlanInput(
  profile: Partial<BaseProfileData>
): GeneratePersonalizedMealPlanInput {
  const input: GeneratePersonalizedMealPlanInput = {
    age: profile.age!,
    gender: profile.gender!,
    height_cm: profile.height_cm!,
    current_weight: profile.current_weight!,
    goal_weight_1m: profile.goal_weight_1m!,
    activityLevel: profile.activityLevel!,
    dietGoalOnboarding: profile.dietGoalOnboarding!,

    // Optional fields
    ideal_goal_weight: profile.ideal_goal_weight ?? undefined,
    bf_current: profile.bf_current ?? undefined,
    bf_target: profile.bf_target ?? undefined,
    bf_ideal: profile.bf_ideal ?? undefined,
    mm_current: profile.mm_current ?? undefined,
    mm_target: profile.mm_target ?? undefined,
    mm_ideal: profile.mm_ideal ?? undefined,
    bw_current: profile.bw_current ?? undefined,
    bw_target: profile.bw_target ?? undefined,
    bw_ideal: profile.bw_ideal ?? undefined,
    waist_current: profile.waist_current ?? undefined,
    waist_goal_1m: profile.waist_goal_1m ?? undefined,
    waist_ideal: profile.waist_ideal ?? undefined,
    hips_current: profile.hips_current ?? undefined,
    hips_goal_1m: profile.hips_goal_1m ?? undefined,
    hips_ideal: profile.hips_ideal ?? undefined,
    right_leg_current: profile.right_leg_current ?? undefined,
    right_leg_goal_1m: profile.right_leg_goal_1m ?? undefined,
    right_leg_ideal: profile.right_leg_ideal ?? undefined,
    left_leg_current: profile.left_leg_current ?? undefined,
    left_leg_goal_1m: profile.left_leg_goal_1m ?? undefined,
    left_leg_ideal: profile.left_leg_ideal ?? undefined,
    right_arm_current: profile.right_arm_current ?? undefined,
    right_arm_goal_1m: profile.right_arm_goal_1m ?? undefined,
    right_arm_ideal: profile.right_arm_ideal ?? undefined,
    left_arm_current: profile.left_arm_current ?? undefined,
    left_arm_goal_1m: profile.left_arm_goal_1m ?? undefined,
    left_arm_ideal: profile.left_arm_ideal ?? undefined,
    preferredDiet: profile.preferredDiet ?? undefined,
    allergies: profile.allergies ?? undefined,
    preferredCuisines: profile.preferredCuisines ?? undefined,
    dispreferredCuisines: profile.dispreferredCuisines ?? undefined,
    preferredIngredients: profile.preferredIngredients ?? undefined,
    dispreferredIngredients: profile.dispreferredIngredients ?? undefined,
    preferredMicronutrients: profile.preferredMicronutrients ?? undefined,
    medicalConditions: profile.medicalConditions ?? undefined,
    medications: profile.medications ?? undefined,
    typicalMealsDescription: profile.typicalMealsDescription ?? undefined,
  };

  Object.keys(input).forEach(
    (key) =>
      input[key as keyof GeneratePersonalizedMealPlanInput] === undefined &&
      delete input[key as keyof GeneratePersonalizedMealPlanInput]
  );

  return input;
}

export function getAdjustedMealInput(
  profileData: Partial<BaseProfileData>,
  dailyTargets: DailyTargetsTypes,
  mealToOptimize: MealToOptimizeTypes
) {
  let mealDistribution;
  const userMealDistributions = profileData.mealDistributions;
  if (!userMealDistributions)
    mealDistribution = defaultMacroPercentages[mealToOptimize.name];
  else
    mealDistribution = userMealDistributions.filter(
      (meal) => meal.mealName === mealToOptimize.name
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
      customName: mealToOptimize.customName || '',
      ingredients: preparedIngredients,
      totalCalories: Number(mealToOptimize.totalCalories) || 0,
      totalProtein: Number(mealToOptimize.totalProtein) || 0,
      totalCarbs: Number(mealToOptimize.totalCarbs) || 0,
      totalFat: Number(mealToOptimize.totalFat) || 0,
    },
    targetMacros: targetMacrosForMeal,
    userProfile: {
      age: profileData.age,
      gender: profileData.gender,
      activityLevel: profileData.activityLevel,
      dietGoal: profileData.dietGoalOnboarding,
      preferredDiet: profileData.preferredDiet,
      allergies: profileData.allergies ?? [],
      dispreferredIngredients: profileData.dispreferredIngredients ?? [],
      preferredIngredients: profileData.preferredIngredients ?? [],
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
      dayOfWeek: day,
      meals: mealNames.map((mealName) => ({
        name: mealName,
        customName: '',
        ingredients: [],
        totalCalories: null,
        totalProtein: null,
        totalCarbs: null,
        totalFat: null,
      })),
    })),
  };
}
