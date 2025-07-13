
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
    if (isAuthLoading) {
      return; // Wait for Firebase auth to initialize
    }

    if (authUser) {
      setIsProfileLoading(true);
      getUserProfile(authUser.uid)
        .then((userProfile) => {
          setProfile(userProfile);
        })
        .catch((error) => {
          console.error('Failed to fetch user profile:', error);
          setProfile(null); // Explicitly set to null on error
        })
        .finally(() => {
          setIsProfileLoading(false);
        });
    } else {
      // No authenticated user
      setProfile(null);
      setIsProfileLoading(false);
    }
  }, [authUser, isAuthLoading]);

  const isLoading = isAuthLoading || isProfileLoading;

  useEffect(() => {
    if (isLoading) {
      return; // Do nothing while loading
    }

    const isAuthPage = [
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
    ].includes(pathname);

    // If there's no authenticated user and we're not on an auth page, redirect to login
    if (!authUser) {
      if (!isAuthPage) {
        router.push('/login');
      }
      return;
    }
    
    // If there is an authenticated user, but their profile hasn't finished loading yet or failed
    if(!profile) {
      // This can happen for a brief moment or if Firestore fetch fails.
      // If we know they are logged in but have no profile, something is wrong.
      // We could log out or show an error. For now, we wait.
      return;
    }

    // If onboarding is not complete, redirect to onboarding page
    if (!profile.onboardingComplete) {
      if (pathname !== '/onboarding') {
        router.push('/onboarding');
      }
      return;
    }

    // If user is authenticated and onboarded, but on an auth or onboarding page, redirect to dashboard
    if (isAuthPage || pathname === '/onboarding' || pathname === '/') {
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
        const updatedProfile = await getUserProfile(authUser.uid);
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
        toast({
          title: 'Profile Complete!',
          description: 'Your profile has been saved successfully.',
        });
        // No need to manually push, the useEffect will handle it
      } catch (error) {
        console.error('Onboarding completion error:', error);
        toast({
          title: 'Onboarding Error',
          description: 'Could not save your profile. Please try again.',
          variant: 'destructive',
        });
        throw error; // Re-throw to be caught by the form
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
