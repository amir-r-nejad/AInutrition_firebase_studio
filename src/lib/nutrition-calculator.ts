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
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
  } else if (gender === 'female') {
    return 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
  }
  // Fallback for "other" or unspecified - average of male and female
  const bmrMale = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
  const bmrFemale = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
  return (bmrMale + bmrFemale) / 2;
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 * @param bmr - Basal Metabolic Rate.
 * @param activityLevelValue - The value string for activity level (e.g., "sedentary", "light").
 * @returns TDEE in kcal/day.
 */
export function calculateTDEE(bmr: number, activityLevelValue: string): number {
  const level = activityLevels.find((l) => l.value === activityLevelValue);
  const activityFactor = level?.activityFactor || 1.2; // Default to sedentary if not found
  return bmr * activityFactor;
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
  const level = activityLevels.find((l) => l.value === activityLevelValue);
  const proteinFactor = level?.proteinFactorPerKg || 0.8; // Default to sedentary if not found
  return weightKg * proteinFactor;
}

/**
 * Adjusts TDEE based on diet goal.
 * @param tdee - Total Daily Energy Expenditure.
 * @param dietGoal - User's diet goal.
 * @returns Adjusted TDEE (target calories).
 */
// function adjustTDEEForDietGoal(tdee: number, dietGoal: string): number {
//   // FIX: Using correct diet goal values from constants
//   if (dietGoal === 'fat_loss') {
//     return tdee - 500; // Typical 500 kcal deficit for weight loss
//   } else if (dietGoal === 'muscle_gain') {
//     return tdee + 300; // Typical 300-500 kcal surplus for muscle gain
//   }
//   // 'recomp' and 'maintain_weight' will fall through to return tdee
//   return tdee; // Maintain weight
// }

/**
 * Calculates estimated daily targets based on profile.
 * FIX: This function now returns keys that match what the rest of the app expects.
 */
export function calculateEstimatedDailyTargets(profile: {
  biological_sex?: string | null;
  current_weight_kg?: number | null;
  height_cm?: number | null;
  age?: number | null;
  physical_activity_level?: string | null;
  primary_diet_goal?: string | null;
  long_term_goal_weight_kg?: number | null;
  bf_current?: number | null;
  bf_target?: number | null;
  waist_current?: number | null;
  waist_goal_1m?: number | null;
}): {
  target_daily_calories?: number;
  target_protein_g?: number;
  target_carbs_g?: number;
  target_fat_g?: number;
  bmr_kcal?: number;
  maintenance_calories_tdee?: number;
} {
  if (
    !profile.biological_sex ||
    profile.current_weight_kg === undefined ||
    profile.current_weight_kg === null ||
    profile.height_cm === undefined ||
    profile.height_cm === null ||
    profile.age === undefined ||
    profile.age === null ||
    !profile.physical_activity_level ||
    !profile.primary_diet_goal
  ) {
    return {}; // Not enough data
  }

  const bmr = calculateBMR(
    profile.biological_sex,
    profile.current_weight_kg,
    profile.height_cm,
    profile.age
  );
  const tdee = calculateTDEE(bmr, profile.physical_activity_level);

  // This logic is now aligned with the Smart Calorie Planner for consistency.
  let targetCalories = tdee; // Start with maintenance
  if (profile.primary_diet_goal === 'fat_loss') {
    targetCalories = tdee - 500;
  } else if (profile.primary_diet_goal === 'muscle_gain') {
    targetCalories = tdee + 300;
  } else if (profile.primary_diet_goal === 'recomp') {
    targetCalories = tdee - 200; // Slight deficit for recomp
  }

  // Define macro splits based on goal
  let proteinTargetPct = 0.25,
    carbTargetPct = 0.5,
    fatTargetPct = 0.25; // Default for maintenance

  if (profile.primary_diet_goal === 'fat_loss') {
    proteinTargetPct = 0.35;
    carbTargetPct = 0.35;
    fatTargetPct = 0.3;
  } else if (profile.primary_diet_goal === 'muscle_gain') {
    proteinTargetPct = 0.3;
    carbTargetPct = 0.5;
    fatTargetPct = 0.2;
  } else if (profile.primary_diet_goal === 'recomp') {
    proteinTargetPct = 0.4;
    carbTargetPct = 0.35;
    fatTargetPct = 0.25;
  }

  const proteinGrams = Math.round((targetCalories * proteinTargetPct) / 4);
  const carbGrams = Math.round((targetCalories * carbTargetPct) / 4);
  const fatGrams = Math.round((targetCalories * fatTargetPct) / 9);

  // FIX: Return object with keys that match what the application expects
  return {
    target_daily_calories: targetCalories,
    target_protein_g: proteinGrams,
    target_fat_g: fatGrams,
    target_carbs_g: carbGrams,
    bmr_kcal: bmr,
    maintenance_calories_tdee: tdee,
  };
}
