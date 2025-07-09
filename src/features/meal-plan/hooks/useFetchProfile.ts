import { useAuth } from '@/features/auth/contexts/AuthContext';

import type { BaseProfileData, FullProfileType } from '@/lib/schemas';
import { useCallback, useState } from 'react';
import { getFullProfileData } from '../lib/data-service';

export function useFetchProfile() {
  const { user } = useAuth();

  const [profileData, setProfileData] =
    useState<Partial<FullProfileType> | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const fetchUserData = useCallback(
    (
      onError: () => void,
      onSuccess?: (data: Partial<BaseProfileData>) => void,
      onFallback?: () => void
    ) => {
      if (user?.uid) {
        setIsLoadingProfile(true);
        getFullProfileData(user.uid)
          .then((data) => {
            setProfileData(data);
            if (onSuccess) onSuccess(data);
          })
          .catch(() => onError())
          .finally(() => setIsLoadingProfile(false));
      } else {
        setIsLoadingProfile(false);
        if (onFallback) onFallback();
      }
    },
    [user?.uid]
  );

  return { isLoadingProfile, profileData, fetchUserData, user };
}
