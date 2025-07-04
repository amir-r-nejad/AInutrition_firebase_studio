'use client';

import { useToast } from '@/hooks/use-toast';
import { signOut as fSignOut } from '@/lib/firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { getUserProfile, onboardingUpdateUser } from '@/app/api/user/database';
import { useUser } from '@/hooks/use-user';
import type { OnboardingFormValues } from '@/lib/schemas';
import {
  getStoredOnboardingStatus,
  RouteChecker,
  setStoredOnboardingStatus,
} from '../lib/authUtils';

interface User {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;
  logout: () => Promise<void>;
  completeOnboarding: (profileData: OnboardingFormValues) => Promise<void>;
  refreshOnboardingStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const [isOnboarded, setIsOnboarded] = useState<boolean>(
    getStoredOnboardingStatus
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const route = new RouteChecker(pathname);

  async function refreshOnboardingStatus() {
    if (!user?.uid) return;

    try {
      const userProfile = await getUserProfile(user.uid);

      const hasCompletedOnboarding =
        userProfile && userProfile.onboardingComplete ? true : false;

      setIsOnboarded(hasCompletedOnboarding);
      setStoredOnboardingStatus(hasCompletedOnboarding);
    } catch (error) {
      console.error('Failed to refresh onboarding status:', error);
    }
  }

  function logout() {
    if (isLoading) return;

    setIsLoading(true);
    try {
      fSignOut();
      router.push('/login');
      setIsOnboarded(false);
      setStoredOnboardingStatus(false);
      console.log('User logged out successfully');
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
  }

  async function completeOnboarding(profileData: OnboardingFormValues) {
    if (!user?.uid) {
      toast({
        title: 'Authentication Error',
        description: 'No user found. Cannot complete onboarding.',
        variant: 'destructive',
      });
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      await onboardingUpdateUser(user.uid, profileData);

      setIsOnboarded(true);
      setStoredOnboardingStatus(true);

      console.log('Onboarding completed successfully');

      toast({
        title: 'Profile Complete!',
        description: 'Your profile has been saved successfully.',
        variant: 'default',
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: 'Onboarding Error',
        description:
          error instanceof Error
            ? error.message
            : 'Could not save your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    if (isLoading) return;

    // Handle unauthenticated users
    if (!user) {
      if (!route.isAuthPage() && route.isDashboardPage()) {
        console.log('Redirecting unauthenticated user to login');
        router.push('/login');
      }
      return;
    }

    if (user) {
      if (
        !user.emailVerified &&
        !route.isAuthPage() &&
        !route.isOnboardingPage()
      ) {
        toast({
          title: 'Email Not Verified',
          description: 'Please verify your email address to continue.',
          variant: 'destructive',
          duration: 7000,
        });
        return;
      }

      if (!isOnboarded) {
        if (!route.isOnboardingPage()) {
          console.log('Redirecting to onboarding');
          router.push('/onboarding');
        }
        return;
      }

      if (route.isAuthPage() || route.isOnboardingPage()) {
        console.log('Redirecting authenticated user to dashboard');
        router.push('/dashboard');
      }
    }
  }, [
    rawUser,
    isLoading,
    pathname,
    isOnboarded,
    isInitialLoad,
    router,
    toast,
    route.isAuthPage,
    route.isOnboardingPage,
    route.isDashboardPage,
  ]);

  // Refresh onboarding status when user changes
  useEffect(() => {
    if (user?.uid && !isOnboarded) refreshOnboardingStatus();
  }, [rawUser?.uid, isOnboarded, refreshOnboardingStatus]);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isOnboarded,
    logout,
    completeOnboarding,
    refreshOnboardingStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');

  return context;
};
