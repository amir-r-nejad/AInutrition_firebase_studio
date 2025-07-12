
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
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // This effect handles fetching the user's profile from Firestore
    // ONLY after the initial Firebase auth check is complete.
    if (isAuthLoading) {
      return; // Wait for Firebase auth to resolve first
    }

    if (authUser?.uid) {
      // User is logged in via Firebase, now fetch their profile data.
      getUserProfile(authUser.uid)
        .then((userProfile) => {
          if (userProfile) {
            setProfile(userProfile);
          } else {
            // This case might happen if a user is created in Auth but their DB doc fails.
            // For now, we treat them as a new user.
            setProfile({
                ...authUser,
                onboardingComplete: false
            });
          }
        })
        .catch((error) => {
          console.error('Failed to fetch user profile:', error);
          setProfile(null); // Ensure we don't get stuck in a weird state
        });
    } else {
      // No user is logged in with Firebase.
      setProfile(null);
    }
  }, [authUser, isAuthLoading]);


  useEffect(() => {
    // This effect handles routing based on the final loading and profile state.
    if (isAuthLoading) return; // Wait until auth loading is finished.

    const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'].includes(pathname);

    if (!authUser) {
      // User is not authenticated.
      if (!isAuthPage) {
        router.push('/login');
      }
      return;
    }

    // User is authenticated. Now check for onboarding completion from their profile.
    // The profile might still be loading, so we check for its existence.
    if (profile) {
        if (!profile.onboardingComplete) {
            if (pathname !== '/onboarding') {
                router.push('/onboarding');
            }
            return;
        }

        // User is authenticated and onboarded.
        if (isAuthPage || pathname === '/onboarding' || pathname === '/') {
            router.push('/dashboard');
        }
    }


  }, [authUser, profile, isAuthLoading, pathname, router]);

  const logout = useCallback(async () => {
    try {
      await fSignOut();
      setProfile(null); // Clear local profile state
      router.push('/login');
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
        // Refetch profile to get the latest `onboardingComplete` status
        const updatedProfile = await getUserProfile(authUser.uid);
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
        toast({
          title: 'Profile Complete!',
          description: 'Your profile has been saved successfully.',
        });
        // The routing useEffect will handle moving to the dashboard.
      } catch (error) {
        toast({
          title: 'Onboarding Error',
          description: 'Could not save your profile. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [authUser?.uid, toast]
  );

  const contextValue: AuthContextType = {
    user: profile,
    isLoading: isAuthLoading || (!!authUser && !profile), // Loading if auth is loading OR if there's a user but no profile yet
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
