"use client";

import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";

import { auth } from "@/lib/firebase/firebase";
import { addUser } from "@/app/api/user/database";

export function useUser() {
  const [user, setUser] = useState<User|null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  // Ensure addUser is called whenever user is set and not null
  useEffect(() => {
    if (user) {
      addUser(JSON.stringify(user));
    }
  }, [user]);

  return user;
}