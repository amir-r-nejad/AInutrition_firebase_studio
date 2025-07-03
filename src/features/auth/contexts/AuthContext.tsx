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

import {
  addUser,
  getUserProfile,
  onboardingUpdateUser,
} from '@/app/api/user/database';
import { useUser } from '@/hooks/use-user';
import type { OnboardingFormValues } from '@/lib/schemas';
import { Loader2 } from 'lucide-react';

interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean; // Represents overall auth context loading (auth + onboarding check)
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
  const { user: firebaseUser, isLoading: isLoadingUser } = useUser();
  const user: AuthUser | null = firebaseUser
    ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified,
      }
    : null;

  const [isMutating, setIsMutating] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [isOnboardingStatusLoading, setIsOnboardingStatusLoading] =
    useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const isPublicPage = useCallback(() => {
    const publicPages = [
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
    ];
    return publicPages.includes(pathname);
  }, [pathname]);

  const isOnboardingPage = useCallback(() => {
    return pathname === '/onboarding';
  }, [pathname]);

  const refreshOnboardingStatus = useCallback(async () => {
    if (!user?.uid) {
      setIsOnboarded(false);
      setIsOnboardingStatusLoading(false);
      return;
    }
    setIsOnboardingStatusLoading(true);
    try {
      const userProfile = await getUserProfile(user.uid);
      const hasCompletedOnboarding = !!userProfile?.onboardingComplete;
      setIsOnboarded(hasCompletedOnboarding);
      setStoredOnboardingStatus(hasCompletedOnboarding);
    } catch (error) {
      console.error('Failed to refresh onboarding status:', error);
    } finally {
      setIsOnboardingStatusLoading(false);
    }
  }, [user?.uid]);

  // Add user to DB when they log in
  useEffect(() => {
    if (firebaseUser) {
      addUser(JSON.stringify(firebaseUser));
    }
  }, [firebaseUser]);

  // Fetch onboarding status when user object is available
  useEffect(() => {
    if (!isLoadingUser) {
      refreshOnboardingStatus();
    }
  }, [user?.uid, isLoadingUser, refreshOnboardingStatus]);

  // Redirection logic
  useEffect(() => {
    if (isLoadingUser || isOnboardingStatusLoading) {
      // Still loading user or their onboarding status, do nothing.
      return;
    }

    if (!user) {
      // Not logged in
      if (!isPublicPage()) {
        router.push('/login');
      }
    } else {
      // Logged in
      if (!isOnboarded) {
        if (!isOnboardingPage()) {
          router.push('/onboarding');
        }
      } else {
        // Onboarded
        if (isPublicPage() || isOnboardingPage() || pathname === '/') {
          router.push('/dashboard');
        }
      }
    }
  }, [
    user,
    isLoadingUser,
    isOnboardingStatusLoading,
    isOnboarded,
    pathname,
    router,
    isPublicPage,
    isOnboardingPage,
  ]);

  const logout = useCallback(async () => {
    if (isMutating) return;
    setIsMutating(true);
    try {
      await fSignOut();
      setIsOnboarded(false);
      setStoredOnboardingStatus(false);
      // The redirection useEffect will handle pushing to /login
    } catch (error) {
      console.error('Firebase logout error:', error);
      toast({
        title: 'Logout Failed',
        description: 'Could not log out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMutating(false);
    }
  }, [isMutating, toast]);

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
      if (isMutating) return;

      setIsMutating(true);
      try {
        await onboardingUpdateUser(user.uid, profileData);
        await refreshOnboardingStatus(); // Refresh status from DB
        toast({
          title: 'Profile Complete!',
          description: 'Your profile has been saved successfully.',
        });
        // The redirection useEffect will handle the push to /dashboard
      } catch (error) {
        toast({
          title: 'Onboarding Error',
          description:
            error instanceof Error
              ? error.message
              : 'Could not save your profile. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsMutating(false);
      }
    },
    [user?.uid, isMutating, toast, refreshOnboardingStatus]
  );

  if (isLoadingUser || isOnboardingStatusLoading) {
    return (
      <div className='flex h-screen w-full items-center justify-center'>
        <Loader2 className='h-12 w-12 animate-spin text-primary' />
        <p className='ml-4 text-lg'>Loading session...</p>
      </div>
    );
  }

  const contextValue: AuthContextType = {
    user,
    isLoading: isMutating || isLoadingUser || isOnboardingStatusLoading,
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
