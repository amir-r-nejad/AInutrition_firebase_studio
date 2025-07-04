
'use server';

import { db } from '@/lib/firebase/firebase';
import {
  type FullProfileType,
  type OnboardingFormValues,
  type ProfileFormValues,
  type SmartCaloriePlannerFormValues,
  type WeeklyMealPlan,
  preprocessDataForFirestore,
  type GlobalCalculatedTargets,
  defaultMacroPercentages,
  mealNames as defaultMealNames,
} from '@/lib/schemas';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { GeneratePersonalizedMealPlanOutput } from '@/ai/flows/generate-meal-plan';
import { User } from 'firebase/auth';

// =================================================================
// MAIN USER PROFILE FUNCTIONS
// =================================================================

/**
 * Fetches the complete user profile from Firestore.
 * This is the primary function for reading user data.
 */
export async function getUserProfile(
  userId: string
): Promise<FullProfileType | null> {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      return docSnap.data() as FullProfileType;
    } else {
      console.warn('getUserProfile: No user profile found for userId:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Could not fetch user profile from database.');
  }
}

/**
 * Processes and saves data from the onboarding form.
 * Sets onboardingComplete to true.
 */
export async function onboardingUpdateUser(
  userId: string,
  data: OnboardingFormValues
) {
  if (!userId) throw new Error('User ID is required for onboarding.');

  // This server action is now responsible for constructing the database object
  const profileDataToSave: Partial<FullProfileType> = {
    age: data.age,
    gender: data.gender,
    height_cm: data.height_cm,
    current_weight: data.current_weight,
    goal_weight_1m: data.goal_weight_1m,
    ideal_goal_weight: data.ideal_goal_weight,
    activityLevel: data.activityLevel,
    dietGoalOnboarding: data.dietGoalOnboarding,
    smartPlannerData: {
      formValues: {
        age: data.age,
        gender: data.gender,
        height_cm: data.height_cm,
        current_weight: data.current_weight,
        goal_weight_1m: data.goal_weight_1m,
        ideal_goal_weight: data.ideal_goal_weight,
        activity_factor_key: data.activityLevel,
        dietGoal: data.dietGoalOnboarding,
        custom_total_calories: data.custom_total_calories,
        custom_protein_per_kg: data.custom_protein_per_kg,
        remaining_calories_carb_pct: data.remaining_calories_carb_pct,
      },
      results: null, // Results will be calculated and saved via the planner tool
    },
    mealDistributions: defaultMealNames.map((name) => ({
      mealName: name,
      calories_pct: defaultMacroPercentages[name]?.calories_pct || 0,
      protein_pct: defaultMacroPercentages[name]?.protein_pct || 0,
      carbs_pct: defaultMacroPercentages[name]?.carbs_pct || 0,
      fat_pct: defaultMacroPercentages[name]?.fat_pct || 0,
    })),
    onboardingComplete: true,
  };

  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, preprocessDataForFirestore(profileDataToSave), {
      merge: true,
    });
    console.log(
      'onboardingUpdateUser: Successfully updated user doc for UID:',
      userId
    );
    return true;
  } catch (e) {
    console.error('onboardingUpdateUser error:', e);
    throw new Error('Failed to save onboarding data.');
  }
}

// =================================================================
// PAGE-SPECIFIC DATA HANDLERS
// =================================================================

// --- Profile Page ---
export async function getProfileData(
  userId: string
): Promise<Partial<ProfileFormValues>> {
  const fullProfile = await getUserProfile(userId);
  if (!fullProfile) return {};

  return {
    name: fullProfile.name ?? undefined,
    subscriptionStatus: fullProfile.subscriptionStatus ?? undefined,
    goalWeight: fullProfile.goalWeight ?? undefined,
    painMobilityIssues: fullProfile.painMobilityIssues ?? undefined,
    injuries: fullProfile.injuries || [],
    surgeries: fullProfile.surgeries || [],
    exerciseGoals: fullProfile.exerciseGoals || [],
    exercisePreferences: fullProfile.exercisePreferences || [],
    exerciseFrequency: fullProfile.exerciseFrequency ?? undefined,
    exerciseIntensity: fullProfile.exerciseIntensity ?? undefined,
    equipmentAccess: fullProfile.equipmentAccess || [],
  };
}

export async function saveProfileData(
  userId: string,
  data: ProfileFormValues
) {
  if (!userId) throw new Error('User ID is required to save profile data.');

  try {
    const userProfileRef = doc(db, 'users', userId);
    // We only save the fields from the ProfileForm, merging them into any existing data.
    await setDoc(userProfileRef, preprocessDataForFirestore(data), {
      merge: true,
    });
  } catch (error) {
    console.error('Error saving profile to Firestore:', error);
    throw new Error('Could not save profile data.');
  }
}

// --- Smart Calorie Planner ---
export async function getSmartPlannerData(userId: string): Promise<{
  formValues: Partial<SmartCaloriePlannerFormValues>;
  results?: GlobalCalculatedTargets | null;
}> {
  const profile = await getUserProfile(userId);
  if (!profile) return { formValues: {} };

  // Use existing smart planner data if available, otherwise fall back to base profile data
  const formSource =
    profile.smartPlannerData?.formValues ?? (profile as any);

  const formValues: Partial<SmartCaloriePlannerFormValues> = {
    age: formSource.age ?? undefined,
    gender: formSource.gender ?? undefined,
    height_cm: formSource.height_cm ?? undefined,
    current_weight: formSource.current_weight ?? undefined,
    goal_weight_1m: formSource.goal_weight_1m ?? undefined,
    ideal_goal_weight: formSource.ideal_goal_weight ?? undefined,
    activity_factor_key:
      formSource.activity_factor_key ?? formSource.activityLevel ?? 'moderate',
    dietGoal: formSource.dietGoal ?? formSource.dietGoalOnboarding ?? 'fat_loss',
    bf_current: formSource.bf_current ?? undefined,
    bf_target: formSource.bf_target ?? undefined,
    bf_ideal: formSource.bf_ideal ?? undefined,
    mm_current: formSource.mm_current ?? undefined,
    mm_target: formSource.mm_target ?? undefined,
    mm_ideal: formSource.mm_ideal ?? undefined,
    bw_current: formSource.bw_current ?? undefined,
    bw_target: formSource.bw_target ?? undefined,
    bw_ideal: formSource.bw_ideal ?? undefined,
    waist_current: formSource.waist_current ?? undefined,
    waist_goal_1m: formSource.waist_goal_1m ?? undefined,
    waist_ideal: formSource.waist_ideal ?? undefined,
    hips_current: formSource.hips_current ?? undefined,
    hips_goal_1m: formSource.hips_goal_1m ?? undefined,
    hips_ideal: formSource.hips_ideal ?? undefined,
    right_leg_current: formSource.right_leg_current ?? undefined,
    right_leg_goal_1m: formSource.right_leg_goal_1m ?? undefined,
    right_leg_ideal: formSource.right_leg_ideal ?? undefined,
    left_leg_current: formSource.left_leg_current ?? undefined,
    left_leg_goal_1m: formSource.left_leg_goal_1m ?? undefined,
    left_leg_ideal: formSource.left_leg_ideal ?? undefined,
    right_arm_current: formSource.right_arm_current ?? undefined,
    right_arm_goal_1m: formSource.right_arm_goal_1m ?? undefined,
    right_arm_ideal: formSource.right_arm_ideal ?? undefined,
    left_arm_current: formSource.left_arm_current ?? undefined,
    left_arm_goal_1m: formSource.left_arm_goal_1m ?? undefined,
    left_arm_ideal: formSource.left_arm_ideal ?? undefined,
    custom_total_calories: formSource.custom_total_calories ?? undefined,
    custom_protein_per_kg: formSource.custom_protein_per_kg ?? undefined,
    remaining_calories_carb_pct:
      formSource.remaining_calories_carb_pct ?? 50,
  };

  return {
    formValues,
    results: profile.smartPlannerData?.results ?? null,
  };
}

export async function saveSmartPlannerData(
  userId: string,
  data: {
    formValues: SmartCaloriePlannerFormValues;
    results: GlobalCalculatedTargets | null;
  }
) {
  if (!userId) throw new Error('User ID is required.');
  try {
    const userProfileRef = doc(db, 'users', userId);
    const dataToSave = { smartPlannerData: preprocessDataForFirestore(data) };
    await setDoc(userProfileRef, dataToSave, { merge: true });
  } catch (error) {
    console.error('Error saving smart planner data to Firestore:', error);
    throw new Error('Could not save planner data.');
  }
}

// --- Current Meal Plan Page ---
export async function getMealPlanData(
  userId: string
): Promise<WeeklyMealPlan | null> {
  const profile = await getUserProfile(userId);
  return profile?.currentWeeklyPlan ?? null;
}

export async function saveMealPlanData(
  userId: string,
  planData: WeeklyMealPlan
) {
  if (!userId) throw new Error('User ID required to save meal plan.');
  try {
    const userProfileRef = doc(db, 'users', userId);
    const sanitizedPlanData = preprocessDataForFirestore(planData);
    await setDoc(
      userProfileRef,
      { currentWeeklyPlan: sanitizedPlanData },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving meal plan data to Firestore:', error);
    throw new Error('Could not save meal plan data.');
  }
}

// --- AI Meal Plan Page ---
export async function saveOptimizedMealPlan(
  userId: string,
  planData: GeneratePersonalizedMealPlanOutput
) {
  if (!userId) throw new Error('User ID required to save AI meal plan.');
  try {
    const userProfileRef = doc(db, 'users', userId);
    await setDoc(
      userProfileRef,
      { aiGeneratedMealPlan: preprocessDataForFirestore(planData) },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving AI meal plan data to Firestore:', error);
    throw new Error('Could not save AI-generated meal plan.');
  }
}
