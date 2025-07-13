
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

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

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
    // Don't do anything until Firebase has confirmed the auth state
    if (isAuthLoading) {
      return;
    }

    if (!authUser) {
      setProfile(null);
      setIsProfileLoading(false); // No profile to load
      return;
    }

    // User is authenticated, now fetch their profile data.
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
        setIsProfileLoading(false); // Profile loading is finished
      });
  }, [authUser, isAuthLoading]);

  useEffect(() => {
    // Wait until both auth check and profile fetch are complete
    if (isAuthLoading || isProfileLoading) {
      return;
    }

    const isAuthPage = [
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
    ].includes(pathname);

    // If there's no authenticated user, redirect to login unless already on an auth page
    if (!authUser) {
      if (!isAuthPage) {
        router.push('/login');
      }
      return;
    }

    // User is authenticated
    // If onboarding is not complete, redirect to onboarding page
    if (!profile?.onboardingComplete) {
      if (pathname !== '/onboarding') {
        router.push('/onboarding');
      }
      return;
    }

    // If onboarding is complete and user is on an auth page, redirect to dashboard
    if (isAuthPage || pathname === '/onboarding' || pathname === '/') {
      router.push('/dashboard');
    }
  }, [
    isAuthLoading,
    isProfileLoading,
    authUser,
    profile,
    pathname,
    router,
  ]);

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
    isLoading: isAuthLoading || isProfileLoading,
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
