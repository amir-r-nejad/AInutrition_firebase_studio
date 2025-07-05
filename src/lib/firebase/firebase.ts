import { getApp, getApps, initializeApp } from 'firebase/app';
import { applyActionCode, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if all required environment variables are set
export const isConfigured = Object.values(firebaseConfig).every(Boolean);

let app, auth, db, storage;

if (isConfigured) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  console.error(
    "Firebase is not configured. Please set all required NEXT_PUBLIC_FIREBASE_* environment variables in your hosting environment."
  );
}

export { app, auth, db, storage };

export const applyActionCodeForVerification = (oobCode: string) => {
  if (!auth) {
    throw new Error("Firebase is not initialized. Cannot verify action code.");
  }
  return applyActionCode(auth, oobCode);
};
