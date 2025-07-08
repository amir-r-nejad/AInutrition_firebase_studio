import { getApp, getApps, initializeApp } from 'firebase/app';
import { applyActionCode, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBJQkR3v-DtLo7bRZ3nhENneMeT54OLkKA",
  authDomain: "project2-52c08.firebaseapp.com",
  projectId: "project2-52c08",
  storageBucket: "project2-52c08.firebasestorage.app",
  messagingSenderId: "132408690151",
  appId: "1:132408690151:web:bb74c7c4a353a07bec6942",
  measurementId: "G-89TMTTT0B7"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

export const applyActionCodeForVerification = (oobCode: string) => {
  return applyActionCode(auth, oobCode);
};
