import { type GeneratePersonalizedMealPlanInput } from '@/ai/flows/generate-meal-plan';
import { BaseProfileData, FullProfileType } from '@/lib/schemas';

const requiredFields: (keyof FullProfileType)[] = [
  'age',
  'gender',
  'current_weight',
  'height_cm',
  'activityLevel',
  'dietGoalOnboarding',
];

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

  // Clean undefineds
  Object.keys(input).forEach(
    (key) =>
      input[key as keyof GeneratePersonalizedMealPlanInput] === undefined &&
      delete input[key as keyof GeneratePersonalizedMealPlanInput]
  );

  return input;
}

export function getMissingProfileFields(
  profile: Partial<BaseProfileData>
): (keyof Partial<BaseProfileData>)[] {
  return requiredFields.filter((field) => !profile[field]);
}
