import { db } from '@/lib/firebase/clientApp';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { MealInputTypes } from '../types';
import { FullProfileType, preprocessDataForFirestore } from '@/lib/schemas';

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
