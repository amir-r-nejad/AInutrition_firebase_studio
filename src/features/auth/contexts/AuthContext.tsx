
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

import { addUser, getUserProfile } from '@/app/api/user/database';
import { useUser } from '@/hooks/use-user';
import type { FullProfileType } from '@/lib/schemas';
import { Loader2 } from 'lucide-react';

interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isOnboarded: boolean;
  logout: () => Promise<void>;
  refreshOnboardingStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const [profile, setProfile] = useState<FullProfileType | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const isOnboarded = !!profile?.onboardingComplete;
  const isLoading = isLoadingUser || isProfileLoading;

  const fetchUserProfile = useCallback(async () => {
    if (!user?.uid) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }
    setIsProfileLoading(true);
    try {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch user profile.',
        variant: 'destructive',
      });
    } finally {
      setIsProfileLoading(false);
    }
  }, [user?.uid, toast]);

  useEffect(() => {
    if (firebaseUser) {
      addUser(JSON.stringify(firebaseUser));
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (!isLoadingUser) {
      fetchUserProfile();
    }
  }, [user?.uid, isLoadingUser, fetchUserProfile]);

  useEffect(() => {
    if (isLoading) {
      return; // Wait until all loading is complete before attempting to redirect
    }

    const publicPages = [
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
    ];
    const isPublicPage = publicPages.includes(pathname);
    const isOnboardingPage = pathname === '/onboarding';

    if (!user) {
      if (!isPublicPage && pathname !== '/login') {
        router.push('/login');
      }
    } else {
      if (!isOnboarded) {
        if (!isOnboardingPage) {
          router.push('/onboarding');
        }
      } else {
        if (
          (isPublicPage || isOnboardingPage || pathname === '/') &&
          pathname !== '/dashboard'
        ) {
          router.push('/dashboard');
        }
      }
    }
  }, [isLoading, user, isOnboarded, pathname, router]);

  const logout = useCallback(async () => {
    if (isMutating) return;
    setIsMutating(true);
    try {
      await fSignOut();
      setProfile(null); // Clear profile on logout
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

  if (isLoading) {
    return (
      <div className='flex h-screen w-full items-center justify-center'>
        <Loader2 className='h-12 w-12 animate-spin text-primary' />
        <p className='ml-4 text-lg'>Loading session...</p>
      </div>
    );
  }

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isOnboarded,
    logout,
    refreshOnboardingStatus: fetchUserProfile,
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
