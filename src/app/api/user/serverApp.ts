
"use server";

import { FirebaseApp, FirebaseError, initializeApp, initializeServerApp,FirebaseServerApp } from "firebase/app";
import { cookies } from "next/headers";
import { getAuth, NextOrObserver, Unsubscribe, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBJQkR3v-DtLo7bRZ3nhENneMeT54OLkKA",
  authDomain: "project2-52c08.firebaseapp.com",
  projectId: "project2-52c08",
  storageBucket: "project2-52c08.firebasestorage.app",
  messagingSenderId: "132408690151",
  appId: "1:132408690151:web:bb74c7c4a353a07bec6942",
  measurementId: "G-89TMTTT0B7"
};

export interface IAuthincatedAppUser{
    firebaseServerApp:FirebaseApp,
     currentUser: User
}

export async function getAuthenticatedAppForUser(){
  "use server";
  const authIdToken = (await cookies()).get("__session")?.value;

  // Firebase Server App is a new feature in the JS SDK that allows you to
  // instantiate the SDK with credentials retrieved from the client & has
  // other affordances for use in server environments.
  const firebaseServerApp = initializeServerApp(
    // https://github.com/firebase/firebase-js-sdk/issues/8863#issuecomment-2751401913
    initializeApp(firebaseConfig),
    {
      authIdToken,
    }
  );

  const auth = getAuth(firebaseServerApp);
  await auth.authStateReady();

  return JSON.stringify({ firebaseServerApp, currentUser: auth.currentUser });
}
