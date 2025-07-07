import { useAuth } from '@/features/auth/contexts/AuthContext';

import type { BaseProfileData, FullProfileType } from '@/lib/schemas';
import { useCallback, useState } from 'react';

export function useFetchProfile() {
  const { user } = useAuth();

  const [profileData, setProfileData] =
    useState<Partial<FullProfileType> | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const fetchUserData = useCallback(
    (
      fetchFn: (userId: string) => Promise<Partial<BaseProfileData>>,
      onError: () => void,
      onSuccess?: (data: Partial<BaseProfileData>) => void
    ) => {
      if (user?.uid) {
        setIsLoadingProfile(true);
        fetchFn(user.uid)
          .then((data) => {
            setProfileData(data);
            if (onSuccess) onSuccess(data);
          })
          .catch(() => onError())
          .finally(() => setIsLoadingProfile(false));
      } else {
        setIsLoadingProfile(false);
      }
    },
    [user?.uid]
  );

  return { isLoadingProfile, profileData, fetchUserData, user };
}
