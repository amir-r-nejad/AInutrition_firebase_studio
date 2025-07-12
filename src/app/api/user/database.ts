
'use server';
import { db } from '@/lib/firebase/clientApp';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  type OnboardingFormValues,
  type FullProfileType,
  type ProfileFormValues,
  type SmartCaloriePlannerFormValues,
  type GlobalCalculatedTargets,
} from '@/lib/schemas';

export async function addUser(u: string) {
  'use server';
  let user = JSON.parse(u) as User;
  try {
    const userRef = collection(db, 'users');
    const q = query(userRef, where('uid', '==', '' + user.uid));
    const userSnapshot = await getDocs(q);
    if (userSnapshot.empty) {
      await addDoc(userRef, { 
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
    const userRef = doc(db, 'users', userId);
    
    // Create a new object with all onboarding values and set onboardingComplete to true
    const dataToSave: Partial<FullProfileType> = {
      ...onboardingValues,
      onboardingComplete: true,
    };

    // Use setDoc with merge: true to update or create the document
    await setDoc(userRef, dataToSave, { merge: true });
    
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
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const profile = docSnap.data() as FullProfileType;

      const formValues: Partial<SmartCaloriePlannerFormValues> = {
        age: profile.smartPlannerData?.formValues?.age ?? profile.age ?? undefined,
        gender: profile.smartPlannerData?.formValues?.gender ?? profile.gender ?? undefined,
        height_cm: profile.smartPlannerData?.formValues?.height_cm ?? profile.height_cm ?? undefined,
        current_weight:
          profile.smartPlannerData?.formValues?.current_weight ?? profile.current_weight ?? undefined,
        goal_weight_1m:
          profile.smartPlannerData?.formValues?.goal_weight_1m ?? profile.goal_weight_1m ?? undefined,
        ideal_goal_weight:
          profile.smartPlannerData?.formValues?.ideal_goal_weight ?? profile.ideal_goal_weight ?? undefined,
        activity_factor_key:
          profile.smartPlannerData?.formValues?.activity_factor_key ??
          profile.activityLevel ?? 'moderate',
        dietGoal: profile.smartPlannerData?.formValues?.dietGoal ?? profile.dietGoalOnboarding ?? 'fat_loss',
        bf_current:
          profile.smartPlannerData?.formValues?.bf_current ?? profile.bf_current ?? undefined,
        bf_target: profile.smartPlannerData?.formValues?.bf_target ?? profile.bf_target ?? undefined,
        bf_ideal: profile.smartPlannerData?.formValues?.bf_ideal ?? profile.bf_ideal ?? undefined,
        mm_current:
          profile.smartPlannerData?.formValues?.mm_current ?? profile.mm_current ?? undefined,
        mm_target: profile.smartPlannerData?.formValues?.mm_target ?? profile.mm_target ?? undefined,
        mm_ideal: profile.smartPlannerData?.formValues?.mm_ideal ?? profile.mm_ideal ?? undefined,
        bw_current:
          profile.smartPlannerData?.formValues?.bw_current ?? profile.bw_current ?? undefined,
        bw_target: profile.smartPlannerData?.formValues?.bw_target ?? profile.bw_target ?? undefined,
        bw_ideal: profile.smartPlannerData?.formValues?.bw_ideal ?? profile.bw_ideal ?? undefined,
        waist_current:
          profile.smartPlannerData?.formValues?.waist_current ?? profile.waist_current ?? undefined,
        waist_goal_1m:
          profile.smartPlannerData?.formValues?.waist_goal_1m ?? profile.waist_goal_1m ?? undefined,
        waist_ideal:
          profile.smartPlannerData?.formValues?.waist_ideal ?? profile.waist_ideal ?? undefined,
        hips_current:
          profile.smartPlannerData?.formValues?.hips_current ?? profile.hips_current ?? undefined,
        hips_goal_1m:
          profile.smartPlannerData?.formValues?.hips_goal_1m ?? profile.hips_goal_1m ?? undefined,
        hips_ideal:
          profile.smartPlannerData?.formValues?.hips_ideal ?? profile.hips_ideal ?? undefined,
        right_leg_current:
          profile.smartPlannerData?.formValues?.right_leg_current ?? profile.right_leg_current ?? undefined,
        right_leg_goal_1m:
          profile.smartPlannerData?.formValues?.right_leg_goal_1m ?? profile.right_leg_goal_1m ?? undefined,
        right_leg_ideal:
          profile.smartPlannerData?.formValues?.right_leg_ideal ?? profile.right_leg_ideal ?? undefined,
        left_leg_current:
          profile.smartPlannerData?.formValues?.left_leg_current ?? profile.left_leg_current ?? undefined,
        left_leg_goal_1m:
          profile.smartPlannerData?.formValues?.left_leg_goal_1m ?? profile.left_leg_goal_1m ?? undefined,
        left_leg_ideal:
          profile.smartPlannerData?.formValues?.left_leg_ideal ?? profile.left_leg_ideal ?? undefined,
        right_arm_current:
          profile.smartPlannerData?.formValues?.right_arm_current ?? profile.right_arm_current ?? undefined,
        right_arm_goal_1m:
          profile.smartPlannerData?.formValues?.right_arm_goal_1m ?? profile.right_arm_goal_1m ?? undefined,
        right_arm_ideal:
          profile.smartPlannerData?.formValues?.right_arm_ideal ?? profile.right_arm_ideal ?? undefined,
        left_arm_current:
          profile.smartPlannerData?.formValues?.left_arm_current ?? profile.left_arm_current ?? undefined,
        left_arm_goal_1m:
          profile.smartPlannerData?.formValues?.left_arm_goal_1m ?? profile.left_arm_goal_1m ?? undefined,
        left_arm_ideal:
          profile.smartPlannerData?.formValues?.left_arm_ideal ?? profile.left_arm_ideal ?? undefined,
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
        formValues,
        results: profile.smartPlannerData?.results ?? null,
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
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const fullProfile = docSnap.data() as FullProfileType;
      
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

export async function getUserProfile(
  userId: string
): Promise<FullProfileType | null> {
  'use server';
  if (!userId) return null;

  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      return docSnap.data() as FullProfileType;
    } else {
      console.log('No user profile found for userId:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}
