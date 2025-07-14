'use client';
import { User } from '../types/globalTypes'; //it works well
import {
  onAuthStateChanged as _onAuthStateChanged,
  onIdTokenChanged as _onIdTokenChanged,
  confirmPasswordReset,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  sendEmailVerification as sendEmailVerificationAPI,
  signInWithEmailAndPassword,
  signInWithPopup,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { auth } from './clientApp';

export function onAuthStateChanged(cb: (user: User | null) => void) {
  return _onAuthStateChanged(auth, cb);
}

export function onIdTokenChanged(cb: (user: User | null) => void) {
  return _onIdTokenChanged(auth, cb);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Error signing in with Google', error);
    throw error;
  }
}

export async function signOut() {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out', error);
    throw error;
  }
}

export async function login(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error: any) {
    console.error('Error signing in with email', error);
    throw error;
  }
}

export async function sendForgetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email', error);
    throw error;
  }
}

export async function verifyOob(code: string) {
  try {
    return await verifyPasswordResetCode(auth, code);
  } catch (error) {
    console.error('Error verifying oob code', error);
    throw error;
  }
}

export async function confirmPassword(oob: string, reset: string) {
  try {
    await confirmPasswordReset(auth, oob, reset);
  } catch (error) {
    console.error('Error confirming password', error);
    throw error;
  }
}

export async function createUserWithEmailAndPassword(email: string, password: string) {
  try {
    return await firebaseCreateUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error creating user with email and password', error);
    throw error;
  }
}

export async function sendEmailVerification(user: User) {
  try {
    await sendEmailVerificationAPI(user);
  } catch (error) {
    console.error('Error sending email verification', error);
    throw error;
  }
}