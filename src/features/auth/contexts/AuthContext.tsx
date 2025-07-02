'use client';

import { useToast } from '@/hooks/use-toast';
import { signOut as fSignOut } from '@/lib/firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { getUserProfile, onboardingUpdateUser } from '@/app/api/user/database';
import { useUser } from '@/hooks/use-user';
import type { OnboardingFormValues } from '@/lib/schemas';

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

const ONBOARDED_KEY = 'isOnboarded';

const getStoredOnboardingStatus = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(ONBOARDED_KEY) === 'true';
  } catch (error) {
    console.warn('Failed to read onboarding status from localStorage:', error);
    return false;
  }
};

const setStoredOnboardingStatus = (status: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ONBOARDED_KEY, status.toString());
  } catch (error) {
    console.warn('Failed to store onboarding status:', error);
  }
};

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

  const isAuthPage = useCallback(() => {
    const authPages = [
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
    ];
    return authPages.includes(pathname);
  }, [pathname]);

  const isOnboardingPage = useCallback(() => {
    return pathname === '/onboarding';
  }, [pathname]);

  const isDashboardPage = useCallback(() => {
    const publicPages = ['/dashboard'];
    return publicPages.includes(pathname);
  }, [pathname]);

  // Function to refresh onboarding status from server
  const refreshOnboardingStatus = useCallback(async () => {
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
  }, [user?.uid]);

  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    console.log('Auth state changed:', {
      user: user?.uid,
      isLoading,
      pathname,
      isOnboarded,
    });

    if (isLoading) return;

    // Handle unauthenticated users
    if (!user) {
      if (!isAuthPage() && isDashboardPage()) {
        console.log('Redirecting unauthenticated user to login');
        router.push('/login');
      }
      return;
    }

    if (user) {
      if (!user.emailVerified && !isAuthPage() && !isOnboardingPage()) {
        toast({
          title: 'Email Not Verified',
          description: 'Please verify your email address to continue.',
          variant: 'destructive',
          duration: 7000,
        });
        return;
      }

      if (!isOnboarded) {
        if (!isOnboardingPage()) {
          console.log('Redirecting to onboarding');
          router.push('/onboarding');
        }
        return;
      }

      if (isAuthPage() || isOnboardingPage()) {
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
    isAuthPage,
    isOnboardingPage,
    isDashboardPage,
  ]);

  // Refresh onboarding status when user changes
  useEffect(() => {
    if (user?.uid && !isOnboarded) {
      refreshOnboardingStatus();
    }
  }, [user?.uid, isOnboarded, refreshOnboardingStatus]);

  const logout = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await fSignOut();
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
  }, [isLoading, toast]);

  const completeOnboarding = useCallback(
    async (profileData: OnboardingFormValues) => {
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
    },
    [user?.uid, isLoading, router, toast]
  );

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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
