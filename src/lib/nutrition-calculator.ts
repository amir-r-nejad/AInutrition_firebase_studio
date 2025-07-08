import type { ProfileFormValues } from './schemas';
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
  const validTdee = Math.max(0, Number(tdee) || 0);

  if (validTdee === 0) {
    return 0;
  }

  const validDietGoal = String(dietGoal).toLowerCase().trim();

  if (validDietGoal === 'lose_weight' || validDietGoal === 'weight_loss') {
    return Math.max(1200, validTdee - 500); // Ensure minimum 1200 calories
  } else if (
    validDietGoal === 'gain_weight' ||
    validDietGoal === 'weight_gain'
  ) {
    return validTdee + 300; // Typical 300-500 kcal surplus for muscle gain
  }

  return validTdee; // Maintain weight
}

/**
 * Calculates estimated daily targets based on profile.
 */
export function calculateEstimatedDailyTargets(
  profile: Partial<ProfileFormValues>
): {
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  bmr?: number;
  tdee?: number;
} {
  // Handle null/undefined profile
  if (!profile || typeof profile !== 'object') {
    return {};
  }

  // Convert and validate inputs
  const gender = profile.gender ? String(profile.gender).trim() : '';
  const currentWeight = Number(profile.currentWeight) || 0;
  const height = Number(profile.height) || 0;
  const age = Number(profile.age) || 0;
  const activityLevel = profile.activityLevel
    ? String(profile.activityLevel).trim()
    : '';
  const dietGoal = profile.dietGoal ? String(profile.dietGoal).trim() : '';

  // Check if we have minimum required data
  if (
    !gender ||
    currentWeight <= 0 ||
    height <= 0 ||
    age <= 0 ||
    !activityLevel ||
    !dietGoal
  ) {
    return {}; // Not enough valid data
  }

  const bmr = calculateBMR(gender, currentWeight, height, age);

  if (bmr === 0) {
    return {};
  }

  const tdee = calculateTDEE(bmr, activityLevel);

  if (tdee === 0) {
    return { bmr };
  }

  const protein = calculateRecommendedProtein(currentWeight, activityLevel);
  const targetCalories = adjustTDEEForDietGoal(tdee, dietGoal);

  if (targetCalories === 0) {
    return { bmr, tdee };
  }

  const proteinCalories = protein * 4;

  // Aim for fat to be ~25% of total calories
  const fatGrams = Math.max(0, Math.round((targetCalories * 0.25) / 9));
  const fatCalories = fatGrams * 9;

  // Remaining calories for carbs
  const remainingCalories = Math.max(
    0,
    targetCalories - proteinCalories - fatCalories
  );
  const carbGrams = Math.max(0, Math.round(remainingCalories / 4));

  return {
    targetCalories,
    targetProtein: protein,
    targetFat: fatGrams,
    targetCarbs: carbGrams,
    bmr,
    tdee,
  };
}
