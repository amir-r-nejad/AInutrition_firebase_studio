
'use server';

import {
  type FullProfileType,
  type OnboardingFormValues,
  type ProfileFormValues,
  type SmartCaloriePlannerFormValues,
  type GlobalCalculatedTargets,
} from '@/lib/schemas';
import { db } from '@/lib/firebase/serverApp'; // Corrected: Use server-safe db
import { User } from 'firebase/auth';

export async function addUser(u: string) {
  'use server';
  let user = JSON.parse(u) as User;
  try {
    const usersCollection = db.collection('users');
    const q = usersCollection.where('uid', '==', user.uid);
    const userSnapshot = await q.get();

    if (userSnapshot.empty) {
      await usersCollection.add({
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
  try {
    // Find the document ID for the user with the given UID
    const usersCollection = db.collection('users');
    const q = usersCollection.where('uid', '==', userId);
    const userSnapshot = await q.get();

    if (userSnapshot.empty) {
      console.error(
        'onboardingUpdateUser error: No user document found for UID:',
        userId
      );
      throw new Error('User document not found.');
    }
    const userDocId = userSnapshot.docs[0].id;
    const userRef = db.collection('users').doc(userDocId);

    // Create a new object with all onboarding values and set onboardingComplete to true
    const dataToSave: Partial<FullProfileType> = {
      ...onboardingValues,
      onboardingComplete: true,
    };

    // Use set with merge: true to update or create the document
    await userRef.set(dataToSave, { merge: true });

    console.log(
      'onboardingUpdateUser: Successfully updated user doc for UID:',
      userId
    );
    return true;
  } catch (e) {
    console.error('onboardingUpdateUser error:', e);
    throw e; // Re-throw the error to be caught by the calling function
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
    if (userProfile) {
      const formValues: Partial<SmartCaloriePlannerFormValues> = {
        age:
          userProfile.smartPlannerData?.formValues?.age ??
          userProfile.age ??
          undefined,
        gender:
          userProfile.smartPlannerData?.formValues?.gender ??
          userProfile.gender ??
          undefined,
        height_cm:
          userProfile.smartPlannerData?.formValues?.height_cm ??
          userProfile.height_cm ??
          undefined,
        current_weight:
          userProfile.smartPlannerData?.formValues?.current_weight ??
          userProfile.current_weight ??
          undefined,
        goal_weight_1m:
          userProfile.smartPlannerData?.formValues?.goal_weight_1m ??
          userProfile.goal_weight_1m ??
          undefined,
        ideal_goal_weight:
          userProfile.smartPlannerData?.formValues?.ideal_goal_weight ??
          userProfile.ideal_goal_weight ??
          undefined,
        activity_factor_key:
          userProfile.smartPlannerData?.formValues?.activity_factor_key ??
          userProfile.activityLevel ??
          'moderate',
        dietGoal:
          userProfile.smartPlannerData?.formValues?.dietGoal ??
          userProfile.dietGoalOnboarding ??
          'fat_loss',
        bf_current:
          userProfile.smartPlannerData?.formValues?.bf_current ??
          userProfile.bf_current ??
          undefined,
        bf_target:
          userProfile.smartPlannerData?.formValues?.bf_target ??
          userProfile.bf_target ??
          undefined,
        bf_ideal:
          userProfile.smartPlannerData?.formValues?.bf_ideal ??
          userProfile.bf_ideal ??
          undefined,
        mm_current:
          userProfile.smartPlannerData?.formValues?.mm_current ??
          userProfile.mm_current ??
          undefined,
        mm_target:
          userProfile.smartPlannerData?.formValues?.mm_target ??
          userProfile.mm_target ??
          undefined,
        mm_ideal:
          userProfile.smartPlannerData?.formValues?.mm_ideal ??
          userProfile.mm_ideal ??
          undefined,
        bw_current:
          userProfile.smartPlannerData?.formValues?.bw_current ??
          userProfile.bw_current ??
          undefined,
        bw_target:
          userProfile.smartPlannerData?.formValues?.bw_target ??
          userProfile.bw_target ??
          undefined,
        bw_ideal:
          userProfile.smartPlannerData?.formValues?.bw_ideal ??
          userProfile.bw_ideal ??
          undefined,
        waist_current:
          userProfile.smartPlannerData?.formValues?.waist_current ??
          userProfile.waist_current ??
          undefined,
        waist_goal_1m:
          userProfile.smartPlannerData?.formValues?.waist_goal_1m ??
          userProfile.waist_goal_1m ??
          undefined,
        waist_ideal:
          userProfile.smartPlannerData?.formValues?.waist_ideal ??
          userProfile.waist_ideal ??
          undefined,
        hips_current:
          userProfile.smartPlannerData?.formValues?.hips_current ??
          userProfile.hips_current ??
          undefined,
        hips_goal_1m:
          userProfile.smartPlannerData?.formValues?.hips_goal_1m ??
          userProfile.hips_goal_1m ??
          undefined,
        hips_ideal:
          userProfile.smartPlannerData?.formValues?.hips_ideal ??
          userProfile.hips_ideal ??
          undefined,
        right_leg_current:
          userProfile.smartPlannerData?.formValues?.right_leg_current ??
          userProfile.right_leg_current ??
          undefined,
        right_leg_goal_1m:
          userProfile.smartPlannerData?.formValues?.right_leg_goal_1m ??
          userProfile.right_leg_goal_1m ??
          undefined,
        right_leg_ideal:
          userProfile.smartPlannerData?.formValues?.right_leg_ideal ??
          userProfile.right_leg_ideal ??
          undefined,
        left_leg_current:
          userProfile.smartPlannerData?.formValues?.left_leg_current ??
          userProfile.left_leg_current ??
          undefined,
        left_leg_goal_1m:
          userProfile.smartPlannerData?.formValues?.left_leg_goal_1m ??
          userProfile.left_leg_goal_1m ??
          undefined,
        left_leg_ideal:
          userProfile.smartPlannerData?.formValues?.left_leg_ideal ??
          userProfile.left_leg_ideal ??
          undefined,
        right_arm_current:
          userProfile.smartPlannerData?.formValues?.right_arm_current ??
          userProfile.right_arm_current ??
          undefined,
        right_arm_goal_1m:
          userProfile.smartPlannerData?.formValues?.right_arm_goal_1m ??
          userProfile.right_arm_goal_1m ??
          undefined,
        right_arm_ideal:
          userProfile.smartPlannerData?.formValues?.right_arm_ideal ??
          userProfile.right_arm_ideal ??
          undefined,
        left_arm_current:
          userProfile.smartPlannerData?.formValues?.left_arm_current ??
          userProfile.left_arm_current ??
          undefined,
        left_arm_goal_1m:
          userProfile.smartPlannerData?.formValues?.left_arm_goal_1m ??
          userProfile.left_arm_goal_1m ??
          undefined,
        left_arm_ideal:
          userProfile.smartPlannerData?.formValues?.left_arm_ideal ??
          userProfile.left_arm_ideal ??
          undefined,
        custom_total_calories:
          userProfile.smartPlannerData?.formValues?.custom_total_calories ??
          undefined,
        custom_protein_per_kg:
          userProfile.smartPlannerData?.formValues?.custom_protein_per_kg ??
          undefined,
        remaining_calories_carb_pct:
          userProfile.smartPlannerData?.formValues?.remaining_calories_carb_pct ??
          50,
      };
      return {
        formValues,
        results: userProfile.smartPlannerData?.results ?? null,
      };
    }
  } catch (error) {
    console.error('Error fetching smart planner data from Firestore:', error);
  }
  return { formValues: {} };
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
    } else {
      console.log('No document found for userId:', userId);
    }
  } catch (error) {
    console.error('Error fetching profile from Firestore:', error);
  }

  return {};
}

export async function saveProfileData(userId: string, data: ProfileFormValues) {
  'use server';
  if (!userId) throw new Error('User ID is required to save profile data.');

  try {
    const existingProfile = await getUserProfile(userId);

    const dataToSave: Record<string, any> = { ...existingProfile };

    // Merge only the fields present in ProfileFormValues
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const formKey = key as keyof ProfileFormValues;
        if (data[formKey] === undefined) {
          dataToSave[formKey] = null; // Convert undefined from form to null for Firestore
        } else {
          dataToSave[formKey] = data[formKey];
        }
      }
    }

    const usersCollection = db.collection('users');
    const q = usersCollection.where('uid', '==', userId);
    const userSnapshot = await q.get();

    if (userSnapshot.empty) {
      throw new Error('User document not found for saving profile data.');
    }
    const userDocId = userSnapshot.docs[0].id;
    const userRef = db.collection('users').doc(userDocId);

    await userRef.set(dataToSave, { merge: true });
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

  try {
    const usersCollection = db.collection('users');
    const q = usersCollection.where('uid', '==', userId);
    const userSnapshot = await q.get();

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      return userDoc.data() as FullProfileType;
    } else {
      console.log('No user profile found for userId:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}
