
'use server';

import { getFirebaseAdmin } from '@/lib/firebase/serverApp';
import type {
  FullProfileType,
  GlobalCalculatedTargets,
  OnboardingFormValues,
  ProfileFormValues,
  SmartCaloriePlannerFormValues,
} from '@/lib/schemas';
import type { User } from 'firebase/auth';

export async function addUser(u: string) {
  'use server';
  let user = JSON.parse(u) as User;
  const { db } = getFirebaseAdmin();
  try {
    const usersCollection = db.collection('users');
    const q = usersCollection.where('uid', '==', user.uid);
    const userSnapshot = await q.get();

    if (userSnapshot.empty) {
      const userDocRef = usersCollection.doc(user.uid);
      await userDocRef.set({
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        onboardingComplete: false,
      });
    }
  } catch (e) {
    console.log('addUser error:', e);
  }
}

export async function onboardingUpdateUser(
  userId: string,
  onboardingValues: OnboardingFormValues
): Promise<boolean> {
  const { db } = getFirebaseAdmin();
  try {
    const userRef = db.collection('users').doc(userId);
    const dataToSave: Partial<FullProfileType> = {
      ...onboardingValues,
      onboardingComplete: true,
    };
    await userRef.set(dataToSave, { merge: true });
    return true;
  } catch (e) {
    console.error('onboardingUpdateUser error:', e);
    throw e;
  }
}

export async function getSmartPlannerData(userId: string): Promise<{
  formValues: Partial<SmartCaloriePlannerFormValues>;
  results?: GlobalCalculatedTargets | null;
}> {
  'use server';
  if (!userId) return { formValues: {} };

  try {
    const userProfile = await getUserProfile(userId);
    const formValues: Partial<SmartCaloriePlannerFormValues> = {
      age: userProfile?.age,
      gender: userProfile?.gender,
      height_cm: userProfile?.height_cm,
      current_weight: userProfile?.current_weight,
      goal_weight_1m: userProfile?.goal_weight_1m,
      ideal_goal_weight: userProfile?.ideal_goal_weight,
      activity_factor_key: userProfile?.activityLevel,
      dietGoal: userProfile?.dietGoalOnboarding,
      ...userProfile?.smartPlannerData?.formValues,
    };
    return {
      formValues,
      results: userProfile?.smartPlannerData?.results ?? null,
    };
  } catch (error) {
    console.error('Error fetching smart planner data from Firestore:', error);
    return { formValues: {} };
  }
}

export async function saveSmartPlannerData(
  userId: string,
  data: {
    formValues: SmartCaloriePlannerFormValues;
    results: GlobalCalculatedTargets | null;
  }
) {
  'use server';
  if (!userId) throw new Error('User ID is required.');
  const { db } = getFirebaseAdmin();
  try {
    const userRef = db.collection('users').doc(userId);
    const fullDataToSave: Partial<FullProfileType> = {
      age: data.formValues.age,
      gender: data.formValues.gender,
      height_cm: data.formValues.height_cm,
      current_weight: data.formValues.current_weight,
      goal_weight_1m: data.formValues.goal_weight_1m,
      ideal_goal_weight: data.formValues.ideal_goal_weight,
      activityLevel: data.formValues.activity_factor_key,
      dietGoalOnboarding: data.formValues.dietGoal,
      smartPlannerData: {
        formValues: data.formValues,
        results: data.results,
      },
    };
    await userRef.set(fullDataToSave, { merge: true });
  } catch (error) {
    console.error('Error saving smart planner data:', error);
    throw error;
  }
}

export async function getProfileData(
  userId: string
): Promise<Partial<ProfileFormValues>> {
  'use server';
  if (!userId) return {};

  try {
    const fullProfile = await getUserProfile(userId);
    if (fullProfile) {
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
  } catch (error) {
    console.error('Error fetching profile from Firestore:', error);
  }

  return {};
}

export async function saveProfileData(userId: string, data: ProfileFormValues) {
  'use server';
  if (!userId) throw new Error('User ID is required to save profile data.');
  const { db } = getFirebaseAdmin();

  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.set(data, { merge: true });
  } catch (error) {
    console.error('Error saving profile to Firestore:', error);
    throw error;
  }
}

export async function getUserProfile(
  userId: string
): Promise<FullProfileType | null> {
  'use server';
  if (!userId) return null;
  const { db } = getFirebaseAdmin();

  try {
    const userDocRef = db.collection('users').doc(userId);
    const userSnapshot = await userDocRef.get();

    if (userSnapshot.exists) {
      return userSnapshot.data() as FullProfileType;
    } else {
      console.log('No user profile found for userId:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}
