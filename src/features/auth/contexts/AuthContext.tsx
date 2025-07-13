
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

  const isLoading = isAuthLoading || isProfileLoading;

  useEffect(() => {
    // This effect handles fetching the profile AFTER the auth state is known.
    if (isAuthLoading) {
      return; // Do nothing until Firebase auth state is resolved.
    }

    if (authUser) {
      setIsProfileLoading(true); // Set loading true before fetching
      getUserProfile(authUser.uid)
        .then((userProfile) => {
          setProfile(userProfile);
        })
        .catch((error) => {
          console.error('Failed to fetch user profile:', error);
          setProfile(null);
        })
        .finally(() => {
          setIsProfileLoading(false); // Mark profile loading as complete
        });
    } else {
      // No authenticated user from Firebase.
      setProfile(null);
      setIsProfileLoading(false); // No profile to load, so stop loading.
    }
  }, [authUser, isAuthLoading]); // Reruns ONLY when auth state changes.

  useEffect(() => {
    // This effect handles routing AFTER all loading is complete.
    if (isLoading) {
      return; // Do not perform any routing actions while loading.
    }

    const isAuthPage = [
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
    ].includes(pathname);

    if (!authUser) {
      // User is not logged in.
      if (!isAuthPage) {
        router.push('/login');
      }
    } else {
      // User is logged in.
      if (!profile?.onboardingComplete) {
        // User needs to complete onboarding.
        if (pathname !== '/onboarding') {
          router.push('/onboarding');
        }
      } else {
        // User is onboarded and authenticated.
        if (isAuthPage || pathname === '/onboarding' || pathname === '/') {
          router.push('/dashboard');
        }
      }
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
        throw error;
      }
    },
    [authUser?.uid, toast]
  );

  const contextValue: AuthContextType = {
    user: profile,
    isLoading: isLoading,
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
