
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

  useEffect(() => {
    // Only fetch the meal plan if the user object is available
    if (user?.uid) {
      fetchMealPlan(() => {
        // Handle error, e.g., show a toast. This is passed from the component.
      });
    } else if (!isAuthLoading) {
        // If auth is done and there's no user, we can stop loading.
        setIsLoadingPlan(false);
    }
  }, [user, isAuthLoading, fetchMealPlan]);


  return {
    user,
    profileData: user, // The full user profile is now available from useAuth()
    fetchMealPlan,
    isLoadingPlan: isAuthLoading || isLoadingPlan,
    isLoadingProfile: isAuthLoading, // Profile loading is tied to auth context loading
    weeklyPlan,
    setWeeklyPlan,
  };
}
