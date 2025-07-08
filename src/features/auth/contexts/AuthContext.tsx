
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
import type { FullProfileType } from '@/lib/schemas';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { preprocessDataForFirestore } from '@/lib/schemas';

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

  useEffect(() => {
    const manageUserProfile = async () => {
      if (!firebaseUser) {
        setProfile(null);
        setIsProfileLoading(false);
        return;
      }

      setIsProfileLoading(true);
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as FullProfileType);
        } else {
          // Profile doesn't exist, so let's create it.
          const newProfileData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            onboardingComplete: false, // Default to not onboarded
          };
          await setDoc(userDocRef, preprocessDataForFirestore(newProfileData), { merge: true });
          setProfile(newProfileData as FullProfileType);
          console.log('AuthContext: New user profile created and set in state.');
        }
      } catch (error) {
        console.error('AuthContext: Failed to fetch or create user profile:', error);
        toast({
          title: 'Profile Error',
          description: 'Could not load your user profile data.',
          variant: 'destructive',
        });
        setProfile(null); // Ensure profile is null on error
      } finally {
        setIsProfileLoading(false);
      }
    };

    if (!isLoadingUser) {
      manageUserProfile();
    }
  }, [firebaseUser, isLoadingUser, toast]);


  useEffect(() => {
    if (isLoading) {
      return;
    }

    const publicPages = [
      '/login',
      '/signup',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
    ];
    const isPublicPage = publicPages.some(page => pathname.startsWith(page));
    const isOnboardingPage = pathname === '/onboarding';

    if (!user) {
      if (!isPublicPage) {
        router.push('/login');
      }
    } else {
      if (!isOnboarded) {
        if (!isOnboardingPage) {
          router.push('/onboarding');
        }
      } else {
        if (isPublicPage || isOnboardingPage || pathname === '/') {
          router.push('/dashboard');
        }
      }
    }
  }, [isLoading, user, isOnboarded, pathname, router]);

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
