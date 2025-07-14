"use client";
import { User } from '../types/globalTypes';
import { onIdTokenChanged } from "../lib/firebase/auth";
import { useEffect } from "react";
import { setCookie, deleteCookie } from "cookies-next";


export function useUserSession(initialUser:User|null) {
  useEffect(() => {
    return onIdTokenChanged(async (user: User | null) => {
      if (user) {
        const idToken = await (user as any).getIdToken(); // Explicitly cast to any to access getIdToken
        await setCookie("__session", idToken);
      } else {
        await deleteCookie("__session");
      }
      if (initialUser?.uid === user?.uid) {
        return;
      }
      window.location.reload();
    });
  }, [initialUser]);

  return initialUser;
}