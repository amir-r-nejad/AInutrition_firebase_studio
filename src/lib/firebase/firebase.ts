import { getApp, getApps, initializeApp } from 'firebase/app';
import { applyActionCode, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '../constants';

// Initialize Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const applyActionCodeForVerification = (oobCode: string) =>
  applyActionCode(auth, oobCode);
