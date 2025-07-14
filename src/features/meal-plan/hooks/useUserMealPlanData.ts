
import {
  generateInitialWeeklyPlan,
  getMealPlanData,
} from '@/features/meal-plan/lib/data-service';
import type { WeeklyMealPlan } from '@/lib/schemas';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/contexts/AuthContext';

export function useUserMealPlanData() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyMealPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

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
    profileData: user,
    fetchMealPlan,
    isLoadingPlan: isAuthLoading || isLoadingPlan,
    isLoadingProfile: isAuthLoading,
    weeklyPlan,
    setWeeklyPlan,
  };
}
