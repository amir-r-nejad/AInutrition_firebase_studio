'use client';

import { onAuthStateChanged } from 'firebase/auth';
import { User } from '../types/globalTypes';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/firebase';

// This hook now returns the user and a loading state.
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start in loading state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser: User | null) => {
      setUser(authUser);
      setIsLoading(false); // Auth state is resolved
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user, isLoading };
}
