
'use server';

import { db } from '@/lib/firebase/firebase';
import {
  type ProfileFormValues,
  type WeeklyMealPlan,
  preprocessDataForFirestore,
} from '@/lib/schemas';
import { doc, setDoc } from 'firebase/firestore';
import type { GeneratePersonalizedMealPlanOutput } from '@/ai/flows/generate-meal-plan';

// The get... functions have been removed as they are the source of the server crash.
// Their logic has been moved client-side to the components that use them.
// This ensures that Firestore requests are made from the authenticated client browser,
// which correctly passes Firestore security rules.

// --- Profile Page ---
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
    if (error instanceof Error) {
      throw new Error(`Failed to save profile. Reason: ${error.message}`);
    }
    throw new Error('Could not save profile data due to an unknown error.');
  }
}

// --- Current Meal Plan Page ---
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
    if (error instanceof Error) {
      throw new Error(`Failed to save meal plan. Reason: ${error.message}`);
    }
    throw new Error('Could not save meal plan data due to an unknown error.');
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
    if (error instanceof Error) {
      throw new Error(
        `Failed to save AI-generated meal plan. Reason: ${error.message}`
      );
    }
    throw new Error(
      'Could not save AI-generated meal plan due to an unknown error.'
    );
  }
}
