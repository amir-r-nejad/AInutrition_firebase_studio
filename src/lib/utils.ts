
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Assuming these types are defined in your project's schema file
import { FullProfileType, GeneratePersonalizedMealPlanInput } from '@/lib/schemas';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    ...options,
  }).format(value);
}

/**
 * Parses a generic error from an AI API call and returns a user-friendly message.
 * @param error The error object caught from the API call.
 * @returns A user-friendly error string.
 */
export function getAIApiErrorMessage(error: any): string {
  const genericMessage =
    'An unexpected error occurred with the AI service. Please try again later.';
  if (!error || !error.message || typeof error.message !== 'string') {
    return genericMessage;
  }

  const message = error.message as string;

  if (message.includes('503') || message.includes('overloaded')) {
    return 'The AI model is currently busy or unavailable. Please try again in a few moments.';
  }

  if (
    message.includes('403 Forbidden') ||
    message.includes('API_KEY_SERVICE_BLOCKED')
  ) {
    return 'AI API Error: Access is forbidden. Please check if your Google AI API key is correct and that the "Generative Language API" is enabled in your Google Cloud project.';
  }

  if (message.includes('400 Bad Request')) {
    return 'AI API Error: The request was malformed, which might be due to a temporary issue or invalid input. Please check your inputs and try again.';
  }

  if (message.includes('500 Internal Server Error')) {
    return 'AI API Error: The AI service is currently experiencing issues. Please try again later.';
  }

  // Return a snippet of the original error for context without being too verbose.
  return `AI Error: ${message.substring(0, 150)}${
    message.length > 150 ? '...' : ''
  }`;
}

export function mapProfileToMealPlanInput(
  profile: Partial<FullProfileType>
): GeneratePersonalizedMealPlanInput {
  const input: GeneratePersonalizedMealPlanInput = {
    age: profile.age ?? undefined, // Add age back
    gender: profile.gender ?? undefined, // Add gender back
    height_cm: profile.height_cm ?? undefined, // Add height_cm back
    current_weight: profile.current_weight ?? undefined, // Add current_weight back
    goal_weight_1m: profile.goal_weight_1m ?? undefined, // Add goal_weight_1m back
    activityLevel: profile.activityLevel ?? undefined, // Add activityLevel back
    dietGoalOnboarding: profile.dietGoalOnboarding ?? undefined, // Add dietGoalOnboarding back
    ideal_goal_weight: profile.ideal_goal_weight ?? undefined, // Add ideal_goal_weight back
    bf_current: profile.bf_current ?? undefined, // Add bf_current back
    bf_target: profile.bf_target ?? undefined, // Add bf_target back
    bf_ideal: profile.bf_ideal ?? undefined, // Add bf_ideal back
    mm_current: profile.mm_current ?? undefined, // Add mm_current back
    mm_target: profile.mm_target ?? undefined, // Add mm_target back
    mm_ideal: profile.mm_ideal ?? undefined, // Add mm_ideal back
    bw_current: profile.bw_current ?? undefined, // Add bw_current back
    bw_target: profile.bw_target ?? undefined, // Add bw_target back
    bw_ideal: profile.bw_ideal ?? undefined, // Add bw_ideal back
    waist_current: profile.waist_current ?? undefined, // Add waist_current back
    waist_goal_1m: profile.waist_goal_1m ?? undefined, // Add waist_goal_1m back
    waist_ideal: profile.waist_ideal ?? undefined, // Add waist_ideal back
    hips_current: profile.hips_current ?? undefined, // Add hips_current back
    hips_goal_1m: profile.hips_goal_1m ?? undefined, // Add hips_goal_1m back
    hips_ideal: profile.hips_ideal ?? undefined, // Add hips_ideal back
    right_leg_current: profile.right_leg_current ?? undefined, // Add right_leg_current back
    right_leg_goal_1m: profile.right_leg_goal_1m ?? undefined, // Add right_leg_goal_1m back
    right_leg_ideal: profile.right_leg_ideal ?? undefined, // Add right_leg_ideal back
    left_leg_current: profile.left_leg_current ?? undefined, // Add left_leg_current back
    left_leg_goal_1m: profile.left_leg_goal_1m ?? undefined, // Add left_leg_goal_1m back
    left_leg_ideal: profile.left_leg_ideal ?? undefined, // Add left_leg_ideal back
    right_arm_current: profile.right_arm_current ?? undefined, // Add right_arm_current back
    right_arm_goal_1m: profile.right_arm_goal_1m ?? undefined, // Add right_arm_goal_1m back
    right_arm_ideal: profile.right_arm_ideal ?? undefined, // Add right_arm_ideal back
    left_arm_current: profile.left_arm_current ?? undefined, // Add left_arm_current back
    left_arm_goal_1m: profile.left_arm_goal_1m ?? undefined, // Add left_arm_goal_1m back
    left_arm_ideal: profile.left_arm_ideal ?? undefined, // Add left_arm_ideal back
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
    mealTargets: [],
  };
  return input;
}
