
import type { FullProfileType, ProfileFormValues } from './schemas';
import { activityLevels } from './constants';

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation.
 * @param gender - User's gender ("male" or "female").
 * @param weightKg - Weight in kilograms.
 * @param heightCm - Height in centimeters.
 * @param ageYears - Age in years.
 * @returns BMR in kcal/day.
 */
export function calculateBMR(
  gender: string,
  weightKg: number,
  heightCm: number,
  ageYears: number
): number {
  // Input validation and sanitization
  const validWeightKg = Math.max(0, Number(weightKg) || 0);
  const validHeightCm = Math.max(0, Number(heightCm) || 0);
  const validAgeYears = Math.max(0, Number(ageYears) || 0);

  // Return 0 if any critical input is invalid
  if (validWeightKg === 0 || validHeightCm === 0 || validAgeYears === 0) {
    return 0;
  }

  const validGender = String(gender).toLowerCase().trim();

  if (validGender === 'male') {
    return Math.round(
      10 * validWeightKg + 6.25 * validHeightCm - 5 * validAgeYears + 5
    );
  } else if (validGender === 'female') {
    return Math.round(
      10 * validWeightKg + 6.25 * validHeightCm - 5 * validAgeYears - 161
    );
  }

  // Fallback for "other" or unspecified - average of male and female
  const bmrMale =
    10 * validWeightKg + 6.25 * validHeightCm - 5 * validAgeYears + 5;
  const bmrFemale =
    10 * validWeightKg + 6.25 * validHeightCm - 5 * validAgeYears - 161;
  return Math.round((bmrMale + bmrFemale) / 2);
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 * @param bmr - Basal Metabolic Rate.
 * @param activityLevelValue - The value string for activity level (e.g., "sedentary", "light").
 * @returns TDEE in kcal/day.
 */
export function calculateTDEE(bmr: number, activityLevelValue: string): number {
  const validBmr = Math.max(0, Number(bmr) || 0);

  if (validBmr === 0) {
    return 0;
  }

  const validActivityLevelValue = String(activityLevelValue)
    .toLowerCase()
    .trim();
  const level = activityLevels.find(
    (l) => String(l.value).toLowerCase().trim() === validActivityLevelValue
  );

  const activityFactor = level?.activityFactor || 1.2; // Default to sedentary if not found
  return Math.round(validBmr * activityFactor);
}

/**
 * Calculates a basic recommended protein intake based on body weight and activity level.
 * @param weightKg - Weight in kilograms.
 * @param activityLevelValue - User's activity level.
 * @returns Recommended protein in grams/day.
 */
export function calculateRecommendedProtein(
  weightKg: number,
  activityLevelValue: string
): number {
  const validWeightKg = Math.max(0, Number(weightKg) || 0);

  if (validWeightKg === 0) {
    return 0;
  }

  const validActivityLevelValue = String(activityLevelValue)
    .toLowerCase()
    .trim();
  const level = activityLevels.find(
    (l) => String(l.value).toLowerCase().trim() === validActivityLevelValue
  );

  const proteinFactor = level?.proteinFactorPerKg || 0.8; // Default to sedentary if not found
  return Math.round(validWeightKg * proteinFactor);
}

/**
 * Adjusts TDEE based on diet goal.
 * @param tdee - Total Daily Energy Expenditure.
 * @param dietGoal - User's diet goal.
 * @returns Adjusted TDEE (target calories).
 */
function adjustTDEEForDietGoal(tdee: number, dietGoal: string): number {
  if (dietGoal === 'lose_weight') {
    return tdee - 500; // Typical 500 kcal deficit for weight loss
  } else if (dietGoal === 'gain_weight') {
    return tdee + 300; // Typical 300-500 kcal surplus for muscle gain
  }
  return tdee; // Maintain weight
}

/**
 * Calculates estimated daily targets based on profile.
 * FIX: This function now returns keys that match what the rest of the app expects.
 */
export function calculateEstimatedDailyTargets(profile: {
  gender?: string | null;
  currentWeight?: number | null;
  height?: number | null;
  age?: number | null;
  activityLevel?: string | null;
  dietGoal?: string | null;
  goalWeight?: number | null;
  bf_current?: number | null;
  bf_target?: number | null;
  waist_current?: number | null;
  waist_goal_1m?: number | null;
}): {
  finalTargetCalories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
  bmr?: number;
  tdee?: number;
} {
  if (
    !profile.gender ||
    profile.currentWeight === undefined ||
    profile.height === undefined ||
    profile.age === undefined ||
    !profile.activityLevel ||
    !profile.dietGoal
  ) {
    return {}; // Not enough valid data
  }

  const bmr = calculateBMR(
    profile.gender,
    profile.currentWeight,
    profile.height,
    profile.age
  );
  let tdee = calculateTDEE(bmr, profile.activityLevel);
  const protein = calculateRecommendedProtein(
    profile.currentWeight,
    profile.activityLevel
  );

  const targetCalories = adjustTDEEForDietGoal(tdee, profile.dietGoal);

  const proteinCalories = protein * 4;
  // Aim for fat to be ~25% of total calories
  const fatGrams = Math.round((targetCalories * 0.25) / 9);
  const fatCalories = fatGrams * 9;
  // Remaining calories for carbs
  const carbGrams = Math.round(
    (targetCalories - proteinCalories - fatCalories) / 4
  );

  return {
    targetCalories: targetCalories,
    targetProtein: protein,
    targetFat: fatGrams, // Ensure non-negative
    targetCarbs: carbGrams, // Ensure non-negative
    bmr: bmr,
    tdee: tdee,
  };
}
