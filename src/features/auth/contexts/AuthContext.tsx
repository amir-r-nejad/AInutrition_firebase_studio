
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

import { getUserProfile } from '@/app/api/user/database';
import { useUser } from '@/hooks/use-user';
import type { FullProfileType } from '@/lib/schemas';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';

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

  const [profile, setProfile] = useState<FullProfileType | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const isOnboarded = !!profile?.onboardingComplete;
  const isLoading = isLoadingUser || isProfileLoading;

  const fetchUserProfile = useCallback(async (isRefresh = false) => {
    if (!user?.uid) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }
    
    // Only show global loading on initial load, not on manual refresh
    if (!isRefresh) {
        setIsProfileLoading(true);
    }

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
      // This logic runs on the client after a user logs in or auth state changes.
      // It checks if a user profile document exists in Firestore and creates one if not.
      const addUserProfileOnClient = async () => {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (!docSnap.exists()) {
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              onboardingComplete: false,
            };
            await setDoc(userDocRef, userData, { merge: true });
            console.log('AuthContext: New user profile created on client.');
          }
        } catch (e) {
          console.error('AuthContext: Error creating user profile:', e);
          toast({
            title: 'Profile Creation Failed',
            description:
              'Could not create your user profile in the database. Some features may not work.',
            variant: 'destructive',
          });
        }
      };
      
      addUserProfileOnClient().then(() => {
        // After ensuring profile exists, fetch it
        if (!isLoadingUser) {
            fetchUserProfile(false);
        }
      });
    } else {
        // If no firebaseUser, ensure profile is cleared and not loading.
        setProfile(null);
        setIsProfileLoading(false);
    }
  }, [firebaseUser, toast, isLoadingUser, fetchUserProfile]);

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
    try {
      await fSignOut();
      setProfile(null); // Clear profile on logout
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
    refreshOnboardingStatus: () => fetchUserProfile(true),
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
