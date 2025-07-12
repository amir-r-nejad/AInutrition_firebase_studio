
import {
  generateInitialWeeklyPlan,
  getMealPlanData,
  getProfileDataForOptimization,
} from '@/features/meal-plan/lib/data-service';
import type { FullProfileType, WeeklyMealPlan } from '@/lib/schemas';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/contexts/AuthContext';

export function useUserMealPlanData() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyMealPlan | null>(null);
  const [profileData, setProfileData] = useState<Partial<FullProfileType> | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const fetchUserData = useCallback(() => {
    if (user?.uid) {
      setIsLoadingProfile(true);
      getProfileDataForOptimization(user.uid)
        .then((data) => {
          setProfileData(data);
        })
        .catch(() => {
          // Handle error, e.g., show a toast
        })
        .finally(() => setIsLoadingProfile(false));
    } else {
      setIsLoadingProfile(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const fetchMealPlan = useCallback(
    (onError: () => void) => {
      if (!user?.uid) {
        setIsLoadingPlan(false);
        setWeeklyPlan(generateInitialWeeklyPlan());
        return;
      }

      setIsLoadingPlan(true);
      getMealPlanData(user.uid)
        .then((plan) => {
          if (plan) setWeeklyPlan(plan);
          else setWeeklyPlan(generateInitialWeeklyPlan());
        })
        .catch(() => {
          onError();
          setWeeklyPlan(generateInitialWeeklyPlan());
        })
        .finally(() => setIsLoadingPlan(false));
    },
    [user?.uid]
  );

  return {
    user,
    profileData,
    fetchUserData,
    fetchMealPlan,
    isLoadingPlan: isAuthLoading || isLoadingPlan,
    isLoadingProfile: isAuthLoading || isLoadingProfile,
    weeklyPlan,
    setWeeklyPlan,
  };
}
