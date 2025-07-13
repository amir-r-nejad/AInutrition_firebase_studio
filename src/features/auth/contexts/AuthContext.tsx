
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

import { useUser } from '@/hooks/use-user';
import type { FullProfileType, OnboardingFormValues } from '@/lib/schemas';
import {
  getUserProfile,
  onboardingUpdateUser,
} from '@/app/api/user/database';

interface AuthContextType {
  user: FullProfileType | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  completeOnboarding: (profileData: OnboardingFormValues) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser, isLoading: isAuthLoading } = useUser();
  const [profile, setProfile] = useState<FullProfileType | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // This effect handles fetching the user's profile from Firestore
    // once the initial Firebase Auth state is resolved.
    if (isAuthLoading) {
      // Don't do anything until Firebase Auth has confirmed the login state.
      return;
    }

    if (authUser) {
      // User is authenticated with Firebase. Now fetch their profile data.
      setIsProfileLoading(true);
      getUserProfile(authUser.uid)
        .then((userProfile) => {
          setProfile(userProfile);
        })
        .catch((error) => {
          console.error('Failed to fetch user profile:', error);
          setProfile(null); // Ensure profile is null on error
        })
        .finally(() => {
          setIsProfileLoading(false); // Profile fetch attempt is complete
        });
    } else {
      // No authenticated user, so no profile to fetch.
      setProfile(null);
      setIsProfileLoading(false);
    }
  }, [authUser, isAuthLoading]); // This runs ONLY when auth state changes.

  const isLoading = isAuthLoading || isProfileLoading;

  useEffect(() => {
    // This effect handles routing based on the user's state.
    // It waits until the combined loading state is false.
    if (isLoading) {
      return;
    }

    const isAuthPage = [
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
    ].includes(pathname);

    if (!authUser) {
      // If user is not logged in, and not on an auth page, redirect to login.
      if (!isAuthPage) {
        router.push('/login');
      }
      return;
    }

    // From here, we know `authUser` exists.
    if (!profile?.onboardingComplete) {
      // If user is logged in but hasn't completed onboarding, redirect them.
      if (pathname !== '/onboarding') {
        router.push('/onboarding');
      }
      return;
    }

    // If user is logged in and has completed onboarding.
    if (isAuthPage || pathname === '/onboarding' || pathname === '/') {
      // If they are on an auth page, the onboarding page, or the root, send to dashboard.
      router.push('/dashboard');
    }
  }, [isLoading, authUser, profile, pathname, router]);

  const logout = useCallback(async () => {
    try {
      await fSignOut();
      setProfile(null);
      router.push('/login');
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Firebase logout error:', error);
      toast({
        title: 'Logout Failed',
        description: 'Could not log out. Please try again.',
        variant: 'destructive',
      });
    }
  }, [router, toast]);

  const completeOnboarding = useCallback(
    async (profileData: OnboardingFormValues) => {
      if (!authUser?.uid) {
        toast({
          title: 'Authentication Error',
          description: 'No user found. Cannot complete onboarding.',
          variant: 'destructive',
        });
        return;
      }
      try {
        await onboardingUpdateUser(authUser.uid, profileData);
        // After saving, re-fetch the profile to get the latest `onboardingComplete` status
        const updatedProfile = await getUserProfile(authUser.uid);
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
        toast({
          title: 'Profile Complete!',
          description: 'Your profile has been saved successfully.',
        });
      } catch (error) {
        console.error('Onboarding completion error:', error);
        toast({
          title: 'Onboarding Error',
          description: 'Could not save your profile. Please try again.',
          variant: 'destructive',
        });
        throw error; // Re-throw to let the form know about the error
      }
    },
    [authUser?.uid, toast]
  );

  const contextValue: AuthContextType = {
    user: profile,
    isLoading,
    logout,
    completeOnboarding,
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
