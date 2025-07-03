import { db } from '@/lib/firebase/clientApp';
import { doc, setDoc } from 'firebase/firestore';
import { MealInputTypes } from '../types';
import { preprocessDataForFirestore } from '@/lib/schemas';

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
