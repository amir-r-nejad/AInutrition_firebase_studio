
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { getProfileDataForOptimization } from '@/features/meal-plan/lib/data-service';
import type { BaseProfileData, FullProfileType } from '@/lib/schemas';
import { useCallback, useEffect, useState } from 'react';

export function useFetchProfile() {
  const { user } = useAuth();

  const [profileData, setProfileData] =
    useState<Partial<FullProfileType> | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const fetchUserData = useCallback(
    () => {
      if (user?.uid) {
        setIsLoadingProfile(true);
        getProfileDataForOptimization(user.uid)
          .then((data) => {
            setProfileData(data);
          })
          .catch(() => {
            // Handle error, maybe with a toast
          })
          .finally(() => setIsLoadingProfile(false));
      } else {
        setIsLoadingProfile(false);
      }
    },
    [user?.uid]
  );

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);


  return { isLoadingProfile, profileData, fetchUserData, user };
}
