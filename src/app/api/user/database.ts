'use server';

import { db } from '@/lib/firebase/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  CustomCalculatedTargets,
  FullProfileType,
  GlobalCalculatedTargets,
  OnboardingFormValues,
  ProfileFormValues,
  SmartCaloriePlannerFormValues,
} from '../../../lib/schemas';

export async function addUser(u: string) {
  let user = JSON.parse(u) as User;
  try {
    const userRef = collection(db, 'users');
    const q = query(userRef, where('uid', '==', '' + user.uid));
    const userSnapshot = await getDocs(q);
    console.log('Queried Users: ', userSnapshot.size, 'for UID:', user.uid);
    if (userSnapshot.empty) {
      console.log('No user found, adding new user:', user);
      await addDoc(userRef, user);
    } else {
      console.log('User already exists, not adding.');
    }
    return user;
  } catch (e) {
    console.log('addUser error:', e);
  }
}

export async function onboardingUpdateUser(
  userId: string,
  onboardingValues: OnboardingFormValues
) {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) throw new Error('User not found');

    await updateDoc(userDocRef, onboardingValues);
    return true;
  } catch (e) {
    console.error('onboardingUpdateUser error:', e);
    throw e;
  }
}

export async function getSmartPlannerData(userId: string): Promise<{
  formValues: Partial<SmartCaloriePlannerFormValues>;
  results?: GlobalCalculatedTargets | null;
  manualMacroResults?: CustomCalculatedTargets | null;
}> {
  if (!userId) return { formValues: {} };

  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    console.log('getSmartPlannerData: docSnap.size=', docSnap.data());

    if (docSnap.exists()) {
      const profile = docSnap.data() as FullProfileType;

      // Map FullProfileType fields to SmartCaloriePlannerFormValues
      const formValues: Partial<SmartCaloriePlannerFormValues> = {
        age: profile.smartPlannerData?.formValues?.age ?? undefined,
        gender: profile.smartPlannerData?.formValues?.gender ?? undefined,
        height_cm: profile.smartPlannerData?.formValues?.height_cm ?? undefined,
        current_weight:
          profile.smartPlannerData?.formValues?.current_weight ?? undefined,
        goal_weight_1m:
          profile.smartPlannerData?.formValues?.goal_weight_1m ?? undefined,
        ideal_goal_weight:
          profile.smartPlannerData?.formValues?.ideal_goal_weight ?? undefined,
        activity_factor_key:
          profile.smartPlannerData?.formValues?.activity_factor_key ??
          'moderate',
        dietGoal: profile.smartPlannerData?.formValues?.dietGoal ?? 'fat_loss',
        bf_current:
          profile.smartPlannerData?.formValues?.bf_current ?? undefined,
        bf_target: profile.smartPlannerData?.formValues?.bf_target ?? undefined,
        bf_ideal: profile.smartPlannerData?.formValues?.bf_ideal ?? undefined,
        mm_current:
          profile.smartPlannerData?.formValues?.mm_current ?? undefined,
        mm_target: profile.smartPlannerData?.formValues?.mm_target ?? undefined,
        mm_ideal: profile.smartPlannerData?.formValues?.mm_ideal ?? undefined,
        bw_current:
          profile.smartPlannerData?.formValues?.bw_current ?? undefined,
        bw_target: profile.smartPlannerData?.formValues?.bw_target ?? undefined,
        bw_ideal: profile.smartPlannerData?.formValues?.bw_ideal ?? undefined,
        waist_current:
          profile.smartPlannerData?.formValues?.waist_current ?? undefined,
        waist_goal_1m:
          profile.smartPlannerData?.formValues?.waist_goal_1m ?? undefined,
        waist_ideal:
          profile.smartPlannerData?.formValues?.waist_ideal ?? undefined,
        hips_current:
          profile.smartPlannerData?.formValues?.hips_current ?? undefined,
        hips_goal_1m:
          profile.smartPlannerData?.formValues?.hips_goal_1m ?? undefined,
        hips_ideal:
          profile.smartPlannerData?.formValues?.hips_ideal ?? undefined,
        right_leg_current:
          profile.smartPlannerData?.formValues?.right_leg_current ?? undefined,
        right_leg_goal_1m:
          profile.smartPlannerData?.formValues?.right_leg_goal_1m ?? undefined,
        right_leg_ideal:
          profile.smartPlannerData?.formValues?.right_leg_ideal ?? undefined,
        left_leg_current:
          profile.smartPlannerData?.formValues?.left_leg_current ?? undefined,
        left_leg_goal_1m:
          profile.smartPlannerData?.formValues?.left_leg_goal_1m ?? undefined,
        left_leg_ideal:
          profile.smartPlannerData?.formValues?.left_leg_ideal ?? undefined,
        right_arm_current:
          profile.smartPlannerData?.formValues?.right_arm_current ?? undefined,
        right_arm_goal_1m:
          profile.smartPlannerData?.formValues?.right_arm_goal_1m ?? undefined,
        right_arm_ideal:
          profile.smartPlannerData?.formValues?.right_arm_ideal ?? undefined,
        left_arm_current:
          profile.smartPlannerData?.formValues?.left_arm_current ?? undefined,
        left_arm_goal_1m:
          profile.smartPlannerData?.formValues?.left_arm_goal_1m ?? undefined,
        left_arm_ideal:
          profile.smartPlannerData?.formValues?.left_arm_ideal ?? undefined,
        // Load custom inputs from saved smartPlannerData
        custom_total_calories:
          profile.smartPlannerData?.formValues?.custom_total_calories ??
          undefined,
        custom_protein_per_kg:
          profile.smartPlannerData?.formValues?.custom_protein_per_kg ??
          undefined,
        remaining_calories_carb_pct:
          profile.smartPlannerData?.formValues?.remaining_calories_carb_pct ??
          50,
      };
      return {
        formValues, // Merged form values from profile and specific smart planner inputs
        results: profile.smartPlannerData?.results ?? null,
        //  manualMacroResults: profile.manualMacroResults ?? null, TODO
      };
    }
  } catch (error) {
    throw error;
  }
  return { formValues: {} };
}

export async function getProfileData(
  userId: string
): Promise<Partial<ProfileFormValues>> {
  if (!userId) return {};

  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const fullProfile = docSnap.data() as FullProfileType;
      console.log('Fetched Profile from firestore:', fullProfile);

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
    } else {
      console.log('No document found for userId:', userId);
    }
  } catch (error) {
    throw error;
  }

  console.log('Returning fallback values');
  return {};
}

export async function getUserProfile(
  userId: string
): Promise<FullProfileType | null> {
  'use server';
  if (!userId) return null;

  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) return docSnap.data() as FullProfileType;
    else return null;
  } catch (error) {
    throw error;
  }
}
