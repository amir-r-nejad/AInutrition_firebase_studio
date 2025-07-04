
'use server';

import { db } from '@/lib/firebase/firebase';
import {
  defaultMacroPercentages,
  mealNames as defaultMealNames,
} from '@/lib/constants';
import {
  type FullProfileType,
  type ProfileFormValues,
  type WeeklyMealPlan,
  preprocessDataForFirestore,
} from '@/lib/schemas';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { GeneratePersonalizedMealPlanOutput } from '@/ai/flows/generate-meal-plan';

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
