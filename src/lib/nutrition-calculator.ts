
import { activityLevels } from './constants';

export function calculateBMR(
  gender: string,
  weightKg: number,
  heightCm: number,
  ageYears: number
): number {
  const validWeightKg = Math.max(0, Number(weightKg) || 0);
  const validHeightCm = Math.max(0, Number(heightCm) || 0);
  const validAgeYears = Math.max(0, Number(ageYears) || 0);

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

  const bmrMale =
    10 * validWeightKg + 6.25 * validHeightCm - 5 * validAgeYears + 5;
  const bmrFemale =
    10 * validWeightKg + 6.25 * validHeightCm - 5 * validAgeYears - 161;
  return Math.round((bmrMale + bmrFemale) / 2);
}

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

  const activityFactor = level?.activityFactor || 1.2;
  return Math.round(validBmr * activityFactor);
}

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

  const proteinFactor = level?.proteinFactorPerKg || 0.8;
  return Math.round(validWeightKg * proteinFactor);
}

export function calculateEstimatedDailyTargets(profile: {
  gender?: string | null;
  currentWeight?: number | null;
  height?: number | null;
  age?: number | null;
  activityLevel?: string | null;
  dietGoal?: string | null;
  goalWeight?: number | null;
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
    !profile.currentWeight ||
    !profile.height ||
    !profile.age ||
    !profile.activityLevel ||
    !profile.dietGoal
  ) {
    return {};
  }

  const bmr = calculateBMR(
    profile.gender,
    profile.currentWeight,
    profile.height,
    profile.age
  );
  let tdee = calculateTDEE(bmr, profile.activityLevel);

  let targetCalories = tdee;

  if (profile.dietGoal === 'fat_loss') {
    targetCalories -= 500;
  } else if (profile.dietGoal === 'muscle_gain') {
    targetCalories += 300;
  } else if (profile.dietGoal === 'recomp') {
    targetCalories -= 200;
  }

  let proteinTargetPct = 0.3;
  let carbTargetPct = 0.4;
  let fatTargetPct = 0.3;

  if (profile.dietGoal === 'muscle_gain') {
    proteinTargetPct = 0.3;
    carbTargetPct = 0.5;
    fatTargetPct = 0.2;
  } else if (profile.dietGoal === 'recomp') {
    proteinTargetPct = 0.4;
    carbTargetPct = 0.35;
    fatTargetPct = 0.25;
  }

  const proteinGrams = (targetCalories * proteinTargetPct) / 4;
  const carbGrams = (targetCalories * carbTargetPct) / 4;
  const fatGrams = (targetCalories * fatTargetPct) / 9;

  return {
    finalTargetCalories: Math.round(targetCalories),
    proteinGrams: Math.round(proteinGrams),
    carbGrams: Math.round(carbGrams),
    fatGrams: Math.round(fatGrams),
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
  };
}
