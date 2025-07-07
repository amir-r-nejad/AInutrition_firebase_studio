'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import LoadingScreen from '@/components/ui/LoadingScreen';
import EmptyStateMessage from '@/features/meal-plan/components/optimized/EmptyStateMessage';
import MealPlanOverview from '@/features/meal-plan/components/optimized/MealPlanOverview';
import { useOptimizedMealPlan } from '@/features/meal-plan/hooks/useOptimizedMealPlan';
import { Loader2, Wand2 } from 'lucide-react';

export default function OptimizedMealPlanPage() {
  const { isLoadingProfile, handleGeneratePlan, isLoading, mealPlan, error } =
    useOptimizedMealPlan();

  if (isLoadingProfile)
    return <LoadingScreen loadingLabel='Loading profile data...' />;

  return (
    <div className='container mx-auto py-8'>
      <Card className='shadow-xl'>
        <CardHeader className='flex flex-col md:flex-row justify-between items-start md:items-center'>
          <div>
            <CardTitle className='text-3xl font-bold'>
              AI-Optimized Weekly Meal Plan
            </CardTitle>
            <CardDescription>
              Generate a personalized meal plan based on your profile, goals,
              and preferences.
            </CardDescription>
          </div>
          <Button
            onClick={handleGeneratePlan}
            disabled={isLoading || isLoadingProfile}
            size='lg'
            className='mt-4 md:mt-0'
          >
            {isLoading ? (
              <Loader2 className='mr-2 h-5 w-5 animate-spin' />
            ) : (
              <Wand2 className='mr-2 h-5 w-5' />
            )}
            {isLoading
              ? 'Generating...'
              : isLoadingProfile
              ? 'Loading Profile...'
              : 'Generate New Plan'}
          </Button>
        </CardHeader>
        <CardContent>
          <EmptyStateMessage isEmpty={!mealPlan && !isLoading} error={error} />

          <MealPlanOverview mealPlan={mealPlan} />
        </CardContent>
      </Card>
    </div>
  );
}
