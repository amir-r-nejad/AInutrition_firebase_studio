import admin, { app } from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: app.App;

// This function ensures the Firebase Admin app is initialized only once.
const initializeAdminApp = (): app.App => {
  if (getApps().length > 0) {
    return getApps()[0] as app.App;
  }

  // Check for environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    // This will happen in client-side components but is expected.
    // The error will be caught and handled where `getFirebaseAdmin` is called.
    // This check prevents crashes during the build process.
    return null as any;
  }

  const serviceAccount = {
    projectId: projectId,
    clientEmail: clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };

  return initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${projectId}.firebaseio.com`,
  }) as app.App;
};

// This function provides initialized Firebase services.
export const getFirebaseAdmin = () => {
  if (!adminApp) {
    adminApp = initializeAdminApp();
  }

  if (!adminApp) {
      throw new Error('Firebase Admin SDK is not initialized. Ensure environment variables are set for server-side execution.');
  }

  const auth = getAuth(adminApp);
  const db = getFirestore(adminApp);
  return { app: adminApp, auth, db };
};
