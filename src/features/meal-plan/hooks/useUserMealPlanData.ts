import {
  generateInitialWeeklyPlan,
  getMealPlanData,
} from '@/features/meal-plan/lib/data-service';
import type { FullProfileType, WeeklyMealPlan } from '@/lib/schemas';
import { useCallback, useState } from 'react';
import { useFetchProfile } from './useFetchProfile';

export function useUserMealPlanData() {
  const { user, fetchUserData, isLoadingProfile, profileData } =
    useFetchProfile();
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyMealPlan>(
    generateInitialWeeklyPlan()
  );
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  useState<Partial<FullProfileType> | null>(null);

  const fetchMealPlan = useCallback(
    (onError: () => void) => {
      if (!user?.uid) {
        setIsLoadingPlan(false);
        return setWeeklyPlan(generateInitialWeeklyPlan());
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
    isLoadingPlan,
    weeklyPlan,
    setWeeklyPlan,
    isLoadingProfile,
  };
}
