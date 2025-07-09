import { db } from '@/lib/firebase/clientApp';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import {
  FullProfileType,
  GlobalCalculatedTargets,
  preprocessDataForFirestore,
  SmartCaloriePlannerFormValues,
} from '@/lib/schemas';
import {
  customizePlanFormValues,
  MealInputTypes,
} from '../types/toolsGlobalTypes';

export async function updateMealSuggestion(
  userId: string,
  updatedMeal: MealInputTypes
) {
  if (!userId) throw new Error('User ID is required to save profile data.');

  try {
    const docRef = doc(db, 'users', userId);
    const data = preprocessDataForFirestore(updatedMeal);

    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    throw error;
  }
}

export async function getProfileDataForSuggestions(
  userId: string
): Promise<Partial<FullProfileType>> {
  if (!userId) return {};

  try {
    const docRef = doc(db, 'users', userId);
    const docSnapshot = await getDocFromServer(docRef);

    if (docSnapshot.exists()) {
      return docSnapshot.data() as any;
    }
  } catch (error) {
    console.error(
      'Error fetching profile data from Firestore for suggestions:',
      error
    );
  }
  return {};
}

export async function saveSmartPlannerData(
  userId: string,
  data: {
    formValues: SmartCaloriePlannerFormValues | customizePlanFormValues;
    results: GlobalCalculatedTargets | null;
  }
) {
  if (!userId) throw new Error('User ID is required.');
  try {
    const userProfileRef = doc(db, 'users', userId);

    const dataToSave = { smartPlannerData: preprocessDataForFirestore(data) };
    const dataSave = await setDoc(userProfileRef, dataToSave, { merge: true });
    console.log('Saved smart planner data:', dataSave);
  } catch (error) {
    console.error('Error saving smart planner data to Firestore:', error);
    throw error;
  }
}
