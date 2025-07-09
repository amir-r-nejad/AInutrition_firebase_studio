import {
  generatePersonalizedMealPlan,
  type GeneratePersonalizedMealPlanOutput,
} from '@/ai/flows/generate-meal-plan';
import { saveOptimizedMealPlan } from '@/features/meal-plan/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { mapProfileToMealPlanInput } from '../lib/utils';
import { useFetchProfile } from './useFetchProfile';

export function useOptimizedMealPlan() {
  const { user, profileData, isLoadingProfile, fetchUserData } =
    useFetchProfile();

  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [mealPlan, setMealPlan] =
    useState<GeneratePersonalizedMealPlanOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function setMeal(data: any) {
      if (data.aiGeneratedMealPlan)
        setMealPlan(
          data.aiGeneratedMealPlan as GeneratePersonalizedMealPlanOutput
        );
    }

    function toastError() {
      toast({
        title: 'Error',
        description: 'Could not load your profile data.',
        variant: 'destructive',
      });
    }

    fetchUserData(toastError, setMeal);
  }, [user, toast, fetchUserData]);

  const handleGeneratePlan = async () => {
    if (!user?.uid) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to generate a meal plan.',
        variant: 'destructive',
      });
      return;
    }
    if (!profileData || Object.keys(profileData).length === 0) {
      toast({
        title: 'Profile Incomplete',
        description:
          'Please complete your onboarding profile before generating an AI meal plan.',
        variant: 'destructive',
      });
      return;
    }

    // Map FullProfileType to GeneratePersonalizedMealPlanInput
    const input = mapProfileToMealPlanInput(profileData);

    setIsLoading(true);
    setError(null);
    try {
      const result = await generatePersonalizedMealPlan(input);
      setMealPlan(result);
      await saveOptimizedMealPlan(user.uid, result);
      toast({
        title: 'Meal Plan Generated!',
        description: 'Your AI-optimized weekly meal plan is ready.',
      });
    } catch (err: any) {
      console.error('Error generating meal plan:', err);
      console.error('Full AI error object:', err); // Log the full error object
      const errorMessage = err.message || 'An unknown error occurred.';
      setError(`Failed to generate meal plan: ${errorMessage}`);
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleGeneratePlan, isLoading, isLoadingProfile, mealPlan, error };
}
