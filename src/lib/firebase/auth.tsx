import {
  onAuthStateChanged as _onAuthStateChanged,
  onIdTokenChanged as _onIdTokenChanged,
  confirmPasswordReset,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  GoogleAuthProvider,
  NextOrObserver,
  sendEmailVerification as sendEmailVerificationAPI,
  signInWithEmailAndPassword,
  signInWithPopup,
  User,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { auth } from './firebase';

export function onAuthStateChanged(cb: NextOrObserver<User>) {
  console.log('onAuthStateChanged called', cb);
  return _onAuthStateChanged(auth, cb);
}

export function onIdTokenChanged(cb: NextOrObserver<User>) {
  return _onIdTokenChanged(auth, cb);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error('Error signing in with Google', error);
  }
}

export async function signOut() {
  try {
    return auth.signOut();
  } catch (error) {
    console.error('Error signing out with Google', error);
  }
}
export async function login(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return userCredential; //to do  add cred to database
  } catch (error: any) {
    const errorCode = error.code;
    const errorMessage = error.message; // TODO probebly log them
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string) {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email', error);
    throw error; // Propagate error to be handled in the UI
  }
}

export async function sendForgetPassword(email: string) {
  sendPasswordResetEmail(email);
}
export async function verifyOob(code: string) {
  try {
    return await verifyPasswordResetCode(auth, code);
  } catch (error) {
    console.error('Error signing in with Email', error);
    throw error;
  }
}
export async function confirmPassword(oob: string, reset: string) {
  try {
    return await confirmPasswordReset(auth, oob, reset);
  } catch (error) {
    console.error('Error signing in with Email', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  try {
    const creds = await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error signing in with Email', error);
    throw error;
  }
}

export async function createUserWithEmailAndPassword(
  email: string,
  password: string
) {
  try {
    return await firebaseCreateUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error creating user with email and password', error);
    throw error;
  }
}

export async function sendEmailVerification(user: User) {
  try {
    return await sendEmailVerificationAPI(user);
  } catch (error) {
    console.error('Error sending email verification');
    throw error;
  }
}
