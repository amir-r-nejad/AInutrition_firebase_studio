
'use client';

import { db } from '@/lib/firebase/clientApp';
import { type FullProfileType, type ProfileFormValues } from '@/lib/schemas';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// This function is being deprecated in favor of the server action in /src/app/api/user/database.ts
// It is kept here to prevent breaking imports but should not be used for new development.
// The logic has been moved to saveProfileData in the database.ts file.
export async function saveProfileData(userId: string, data: ProfileFormValues) {
  if (!userId) throw new Error('User ID is required to save profile data.');

  try {
    const userProfileRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userProfileRef);
    let existingProfile: Partial<FullProfileType> = {};
    if (docSnap.exists()) {
      existingProfile = docSnap.data() as FullProfileType;
    }

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

    await setDoc(userProfileRef, dataToSave, { merge: true });
  } catch (error) {
    console.error('Error saving profile to Firestore:', error);
    throw error;
  }
}
