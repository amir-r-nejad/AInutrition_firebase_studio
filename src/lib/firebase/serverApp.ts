import admin, { App } from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// A function to get the initialized Firebase Admin app, creating it if it doesn't exist.
const getFirebaseAdminApp = (): App => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
};

// A function to get the initialized services. This ensures the app is initialized before we try to get auth() or firestore().
export const getFirebaseAdmin = () => {
  const app = getFirebaseAdminApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  return { app, auth, db };
};
