
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { getProfileDataForOptimization } from '@/features/meal-plan/lib/data-service';
import type { FullProfileType } from '@/lib/schemas';
import { useCallback, useEffect, useState } from 'react';

export function useFetchProfile() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [profileData, setProfileData] =
    useState<Partial<FullProfileType> | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const fetchUserData = useCallback(async () => {
    if (user?.uid) {
      setIsLoadingProfile(true);
      try {
        const data = await getProfileDataForOptimization(user.uid);
        setProfileData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    } else {
      setIsLoadingProfile(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchUserData();
    }
  }, [isAuthLoading, fetchUserData]);

  return { isLoadingProfile: isAuthLoading || isLoadingProfile, profileData, fetchUserData, user };
}
