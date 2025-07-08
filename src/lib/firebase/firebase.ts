import { getApp, getApps, initializeApp } from 'firebase/app';
import { applyActionCode, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '../constants';
import { Analytics, getAnalytics, isSupported } from 'firebase/analytics';

// Initialize Firebase
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const applyActionCodeForVerification = (oobCode: string) =>
  applyActionCode(auth, oobCode);

let analytics: Analytics | null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized successfully');
      } else console.log('Firebase Analytics not supported in this browser');
    })
    .catch((error) => {
      console.error('Error checking analytics support:', error);
    });
}

export { analytics };
