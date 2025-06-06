import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, applyActionCode } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';
import { firebaseConfig } from '../constants';

// Initialize Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const applyActionCodeForVerification = applyActionCode;
