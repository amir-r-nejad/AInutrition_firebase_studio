
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
    if (!authUser || isAuthLoading) {
      setIsProfileLoading(false);
      setProfile(null);
      return;
    }

    setIsProfileLoading(true);
    getUserProfile(authUser.uid)
      .then((userProfile) => {
        setProfile(userProfile);
      })
      .catch((error) => {
        console.error('Failed to fetch user profile:', error);
        setProfile(null);
      })
      .finally(() => {
        setIsProfileLoading(false);
      });
  }, [authUser, isAuthLoading]);

  useEffect(() => {
    const isLoading = isAuthLoading || isProfileLoading;
    if (isLoading) return;

    const isAuthPage = [
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
    ].includes(pathname);

    if (!authUser) {
      if (!isAuthPage) {
        router.push('/login');
      }
      return;
    }

    if (profile) {
      if (!profile.onboardingComplete) {
        if (pathname !== '/onboarding') {
          router.push('/onboarding');
        }
        return;
      }
    }

    if (isAuthPage || pathname === '/onboarding' || pathname === '/') {
      router.push('/dashboard');
    }
  }, [authUser, profile, isAuthLoading, isProfileLoading, pathname, router]);

  const logout = useCallback(async () => {
    try {
      await fSignOut();
      setProfile(null);
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
        throw error; // Re-throw to be caught by the form
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
