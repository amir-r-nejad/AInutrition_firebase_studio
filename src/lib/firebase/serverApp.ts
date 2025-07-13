
import admin, { App } from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// This function ensures the Firebase Admin app is initialized only once.
const getFirebaseAdminApp = (): App => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Check for environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin SDK environment variables are not set.');
  }

  const serviceAccount = {
    projectId: projectId,
    clientEmail: clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${projectId}.firebaseio.com`,
  });
};

// This function provides initialized Firebase services.
export const getFirebaseAdmin = () => {
  const app = getFirebaseAdminApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  return { app, auth, db };
};
