'use client';

import { useToast } from '@/hooks/use-toast';
import {
  createUserWithEmailAndPassword as fCreateUserWithEmailAndPassword,
  login as fLogin,
  signOut as fSignOut,
} from '@/lib/firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { onboardingUpdateUser } from '@/app/api/user/database';
import { useUser } from '@/hooks/use-user';
import type { OnboardingFormValues } from '@/lib/schemas';

interface User {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null; // Changed from User | null | undefined
  isLoading: boolean;
  logout: () => Promise<void>;
  completeOnboarding: (profileData: OnboardingFormValues) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to convert undefined to null for Firestore
function preprocessDataForFirestore(
  data: Record<string, any>
): Record<string, any> {
  const processedData: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      processedData[key] = data[key] === undefined ? null : data[key];
    }
  }
  return processedData;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const rawUser = useUser();
  const user: User | null = rawUser
    ? {
        uid: rawUser.uid,
        email: rawUser.email,
        emailVerified: rawUser.emailVerified,
      }
    : null;
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isOnboarded, setIsOnboarded] = useState<boolean>(
    typeof window !== 'undefined'
      ? localStorage.getItem('Onboarded') === 'true'
      : false
  );

  useEffect(() => {
    console.log(
      'useEffect fired: user=',
      user,
      'isLoading=',
      isLoading,
      'pathname=',
      pathname,
      'isOnboarded=',
      isOnboarded
    );
    if (isLoading) return;
    const isAuthPage =
      pathname === '/login' ||
      pathname === '/signup' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password';
    const isOnboardingPage = pathname === '/onboarding';
    console.log(
      `Auth state changed: user=${user}, isLoading=${isLoading}, pathname=${pathname}, isAuthPage=${isAuthPage}, isOnboardingPage=${isOnboardingPage}, isOnboarded=${isOnboarded}`
    );
    if (!user) {
      if (!isAuthPage) {
        router.push('/login');
      }
    } else {
      if (
        !user.emailVerified &&
        pathname !== '/login' &&
        !isOnboardingPage &&
        !isAuthPage
      ) {
        toast({
          title: 'Email Not Verified',
          description: 'Please verify your email address to continue.',
          variant: 'destructive',
          duration: 7000,
        });
      } else if (!isOnboarded) {
        if (!isOnboardingPage) {
          router.push('/onboarding');
        }
      } else {
        // User is authenticated, (email verified or on path to be), and onboarded
        if (isAuthPage || isOnboardingPage) {
          router.push('/dashboard');
        }
      }
    }
  }, [rawUser, isLoading, pathname, router, isOnboarded, toast]);

  const logout = async () => {
    setIsLoading(true);
    const currentUserUid = user?.uid; // Get UID before user state is cleared
    try {
      await fSignOut();
    } catch (error) {
      console.error('Firebase logout error:', error);
      toast({
        title: 'Logout Failed',
        description: 'Could not log out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (profileData: OnboardingFormValues) => {
    if (user && user.uid) {
      // Ensure user and user.uid exist
      try {
        await onboardingUpdateUser(user.uid, profileData);
        localStorage.setItem('Onboarded', 'true');
        setIsOnboarded(true); // Update state so useEffect re-runs
        console.log(
          'Onboarding complete: setIsOnboarded(true), redirecting to /dashboard'
        );
        router.push('/dashboard'); // Ensure redirect after onboarding
        // Fallback: force reload after short delay if not redirected
        setTimeout(() => {
          if (window.location.pathname !== '/dashboard') {
            console.log('Fallback: Forcing redirect to /dashboard');
            window.location.href = '/dashboard';
          }
        }, 1500);
      } catch (error) {
        console.error('Error saving onboarding data to Firestore:', error);
        toast({
          title: 'Onboarding Error',
          description: 'Could not save your profile. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Authentication Error',
        description: 'No user found. Cannot complete onboarding.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, logout, completeOnboarding }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
