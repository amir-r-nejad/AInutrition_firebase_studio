'use client';

import { useAuth } from '@/features/auth/contexts/AuthContext';
import { TotalMacros } from '@/features/tools/types/toolsGlobalTypes';
import { useToast } from '@/hooks/use-toast';
import {
  defaultMacroPercentages,
  mealNames as defaultMealNames,
} from '@/lib/constants';
import { db } from '@/lib/firebase/clientApp';
import { calculateEstimatedDailyTargets } from '@/lib/nutrition-calculator';
import { type FullProfileType } from '@/lib/schemas';
import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

export function useLoadDataForMacro(
  form: UseFormReturn<
    {
      mealDistributions: {
        mealName: string;
        calories_pct: number;
      }[];
    },
    any,
    undefined
  >
) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [dailyTargets, setDailyTargets] = useState<TotalMacros | null>(null);
  const [dataSourceMessage, setDataSourceMessage] = useState<string | null>(
    null
  );

  const loadDataForSplitter = useCallback(async () => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    let targets: TotalMacros | null = null;
    let sourceMessage = '';

    try {
      const userProfileRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userProfileRef);

      if (docSnap.exists()) {
        const profileData = docSnap.data() as FullProfileType;

        if (
          profileData.mealDistributions &&
          Array.isArray(profileData.mealDistributions) &&
          profileData.mealDistributions.length === defaultMealNames.length
        ) {
          form.reset({ mealDistributions: profileData.mealDistributions });
          toast({
            title: 'Loaded Saved Split',
            description:
              'Your previously saved macro split percentages have been loaded.',
            duration: 3000,
          });
        } else {
          form.reset({
            mealDistributions: defaultMealNames.map((name) => ({
              mealName: name,
              calories_pct: defaultMacroPercentages[name]?.calories_pct || 0,
              protein_pct: defaultMacroPercentages[name]?.protein_pct || 0,
              carbs_pct: defaultMacroPercentages[name]?.carbs_pct || 0,
              fat_pct: defaultMacroPercentages[name]?.fat_pct || 0,
            })),
          });
        }

        // Priority: Manual Macro Breakdown results, then Smart Planner results, then Profile estimation
        if (
          profileData.manualMacroResults &&
          profileData.manualMacroResults.totalCalories !== undefined &&
          profileData.manualMacroResults.totalCalories !== null
        ) {
          const manualResults = profileData.manualMacroResults;
          targets = {
            calories: manualResults.totalCalories || 0,
            protein_g: manualResults.proteinGrams || 0,
            carbs_g: manualResults.carbGrams || 0,
            fat_g: manualResults.fatGrams || 0,
            source: 'Manual Macro Breakdown (Smart Planner)',
          };
          sourceMessage =
            "Daily totals from 'Manual Macro Breakdown' in Smart Planner. Adjust there for changes.";
        } else if (
          profileData.smartPlannerData?.results?.finalTargetCalories !==
            undefined &&
          profileData.smartPlannerData?.results?.finalTargetCalories !== null
        ) {
          const usersCustomPlan = profileData.smartPlannerData.formValues;
          const defaultPlan = profileData.smartPlannerData.results;

          const calories = usersCustomPlan?.custom_total_calories
            ? usersCustomPlan.custom_total_calories
            : defaultPlan.finalTargetCalories;

          let smartResults;
          if (
            usersCustomPlan?.proteinGrams ||
            usersCustomPlan?.fatGrams ||
            usersCustomPlan?.carbGrams
          )
            smartResults = profileData.smartPlannerData.formValues;
          else smartResults = profileData.smartPlannerData.results;

          targets = {
            calories: calories || 0,
            protein_g: smartResults?.proteinGrams || 0,
            carbs_g: smartResults?.carbGrams || 0,
            fat_g: smartResults?.fatGrams || 0,
            source: 'Smart Calorie Planner Targets',
          };

          sourceMessage =
            "Daily totals from 'Smart Calorie Planner'. Adjust there for changes.";
        } else if (
          profileData.age &&
          profileData.gender &&
          profileData.current_weight &&
          profileData.height_cm &&
          profileData.activityLevel &&
          profileData.dietGoalOnboarding
        ) {
          const estimatedTargets = calculateEstimatedDailyTargets({
            age: profileData.age,
            gender: profileData.gender,
            currentWeight: profileData.current_weight,
            height: profileData.height_cm,
            activityLevel: profileData.activityLevel,
            dietGoal: profileData.dietGoalOnboarding,
            goalWeight: profileData.goal_weight_1m,
            bf_current: profileData.bf_current,
            bf_target: profileData.bf_target,
            waist_current: profileData.waist_current,
            waist_goal_1m: profileData.waist_goal_1m,
          });
          if (
            estimatedTargets.finalTargetCalories &&
            estimatedTargets.proteinGrams &&
            estimatedTargets.carbGrams &&
            estimatedTargets.fatGrams
          ) {
            targets = {
              calories: estimatedTargets.finalTargetCalories,
              protein_g: estimatedTargets.proteinGrams,
              carbs_g: estimatedTargets.carbGrams,
              fat_g: estimatedTargets.fatGrams,
              source: 'Profile Estimation',
            };
            sourceMessage =
              'Daily totals estimated from Profile. Use Smart Calorie Planner for more precision or manual input.';
          } else {
            toast({
              title: 'Profile Incomplete for Calculation',
              description:
                'Could not calculate daily totals from profile. Ensure all basic info, activity, and diet goal are set in Onboarding or Smart Planner.',
              variant: 'destructive',
              duration: 5000,
            });
          }
        } else {
          toast({
            title: 'Profile Incomplete',
            description:
              'Profile is incomplete. Please fill it via Onboarding or Smart Calorie Planner for daily totals.',
            variant: 'destructive',
            duration: 5000,
          });
        }
      } else {
        toast({
          title: 'Profile Not Found',
          description: 'Could not find user profile for daily totals.',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error Loading Data',
        description: 'Failed to load data for macro estimation.',
        variant: 'destructive',
      });
      console.error('Error in loadDataForSplitter:', error);
    }

    setDailyTargets(targets);
    setDataSourceMessage(sourceMessage);

    if (targets && sourceMessage) {
      toast({
        title: 'Daily Totals Loaded',
        description: sourceMessage,
        duration: 6000,
      });
    } else if (!targets) {
      toast({
        title: 'No Daily Totals',
        description:
          'Could not find or calculate daily macro totals. Please use the Smart Calorie Planner or complete your profile.',
        variant: 'destructive',
        duration: 6000,
      });
    }

    setIsLoading(false);
  }, [form, toast, user?.uid]);

  useEffect(() => {
    loadDataForSplitter();
  }, [loadDataForSplitter]);

  return { user, isLoading, dailyTargets, dataSourceMessage };
}
