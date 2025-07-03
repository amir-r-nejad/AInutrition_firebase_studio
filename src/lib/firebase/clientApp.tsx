'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Ensure Firestore is imported
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

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const firebaseApp = app; // Export the singleton app instance

export const auth = getAuth(app); // Use the singleton app instance for auth
export const db = getFirestore(app); // Initialize and export Firestore
export const storage = getStorage(app); // Use the singleton app instance for storage
