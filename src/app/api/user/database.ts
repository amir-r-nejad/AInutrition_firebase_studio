
'use server';

// IMPORTANT: The functions in this file have been intentionally deprecated and their
// logic moved to the client-side components that use them.
// This architectural change was made to resolve persistent "PERMISSION_DENIED"
// errors. Server actions, when using the Firebase Client SDK, do not have access
// to the user's browser authentication state, causing Firestore security rules to fail.
// By moving all data read/write operations to the client, we ensure that the
// authenticated user's session is correctly used for all Firestore requests.

import type { GeneratePersonalizedMealPlanOutput } from '@/ai/flows/generate-meal-plan';
import { db } from '@/lib/firebase/firebase';
import type { ProfileFormValues, WeeklyMealPlan } from '@/lib/schemas';
import { doc, setDoc } from 'firebase/firestore';

// --- Profile Page ---
export async function saveProfileData(
  userId: string,
  data: ProfileFormValues
) {
  if (!userId) throw new Error('User ID is required to save profile data.');
  throw new Error(
    "DEPRECATED: saveProfileData has been moved to a client-side operation in profile/page.tsx to fix permission errors. Do not use this server action."
  );
}

// --- Current Meal Plan Page ---
export async function saveMealPlanData(
  userId: string,
  planData: WeeklyMealPlan
) {
  if (!userId) throw new Error('User ID required to save meal plan.');
   throw new Error(
    "DEPRECATED: saveMealPlanData has been moved to a client-side operation in meal-plan/current/page.tsx to fix permission errors. Do not use this server action."
  );
}

// --- AI Meal Plan Page ---
export async function saveOptimizedMealPlan(
  userId: string,
  planData: GeneratePersonalizedMealPlanOutput
) {
  if (!userId) throw new Error('User ID required to save AI meal plan.');
   throw new Error(
    "DEPRECATED: saveOptimizedMealPlan has been moved to a client-side operation in meal-plan/optimized/page.tsx to fix permission errors. Do not use this server action."
  );
}
