'use client';

import { adjustMealIngredients } from '@/ai/flows/adjust-meal-ingredients';
import { Card, CardContent } from '@/components/ui/card';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import SectionHeader from '@/components/ui/SectionHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditMealDialog from '@/features/meal-plan/components/current/EditMealDialog';
import MealCardItem from '@/features/meal-plan/components/current/MealCardItem';
import { useUserMealPlanData } from '@/features/meal-plan/hooks/useUserMealPlanData';
import {
  getProfileDataForOptimization,
  saveMealPlanData,
} from '@/features/meal-plan/lib/data-service';
import {
  getAdjustedMealInput,
  getMissingProfileFields,
} from '@/features/meal-plan/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useQueryParams } from '@/hooks/useQueryParams';
import { daysOfWeek } from '@/lib/constants';
import type { Meal } from '@/lib/schemas';
import { useEffect, useState } from 'react';

export default function CurrentMealPlanPage() {
  const { getQueryParams, updateQueryParams } = useQueryParams();
  const { toast } = useToast();

  const {
    user,
    weeklyPlan,
    setWeeklyPlan,
    isLoadingPlan,
    profileData,
    isLoadingProfile,
    fetchMealPlan,
    fetchUserData,
  } = useUserMealPlanData();

  const [editingMeal, setEditingMeal] = useState<{
    dayIndex: number;
    mealIndex: number;
    meal: Meal;
  } | null>(null);
  const [optimizingMealKey, setOptimizingMealKey] = useState<string | null>(
    null
  );

  useEffect(() => {
    function handleError() {
      toast({
        title: 'Error',
        description: 'Could not load profile data for optimization.',
        variant: 'destructive',
      });
    }

    fetchUserData(getProfileDataForOptimization, handleError);
  }, [fetchUserData, toast]);

  useEffect(() => {
    function handleError() {
      toast({
        title: 'Error',
        description: 'Could not load meal plan.',
        variant: 'destructive',
      });
    }

    fetchMealPlan(handleError);
  }, [fetchMealPlan, toast]);

  const handleEditMeal = (dayIndex: number, mealIndex: number) => {
    const mealToEdit = weeklyPlan.days[dayIndex].meals[mealIndex];
    setEditingMeal({
      dayIndex,
      mealIndex,
      meal: JSON.parse(JSON.stringify(mealToEdit)),
    });
  };

  const handleSaveMeal = async (updatedMeal: Meal) => {
    if (!editingMeal || !user?.uid) return;
    const newWeeklyPlan = JSON.parse(JSON.stringify(weeklyPlan));
    newWeeklyPlan.days[editingMeal.dayIndex].meals[editingMeal.mealIndex] =
      updatedMeal;
    setWeeklyPlan(newWeeklyPlan);
    setEditingMeal(null);
    try {
      await saveMealPlanData(user.uid, newWeeklyPlan);
      toast({
        title: 'Meal Saved',
        description: `${
          updatedMeal.customName || updatedMeal.name
        } has been updated.`,
      });
    } catch {
      toast({
        title: 'Save Error',
        description: 'Could not save meal plan.',
        variant: 'destructive',
      });
    }
  };

  const handleOptimizeMeal = async (dayIndex: number, mealIndex: number) => {
    const mealToOptimize = weeklyPlan.days[dayIndex].meals[mealIndex];
    const mealKey = `${weeklyPlan.days[dayIndex].dayOfWeek}-${mealToOptimize.name}-${mealIndex}`;
    setOptimizingMealKey(mealKey);

    if (isLoadingProfile || !profileData) {
      toast({
        title: 'Profile Data Loading',
        description:
          'User profile data is still loading. Please wait a moment and try again.',
        variant: 'default',
      });
      setOptimizingMealKey(null);
      return;
    }

    const missingFields = getMissingProfileFields(profileData);

    if (missingFields.length > 0) {
      toast({
        title: 'Profile Incomplete for Optimization',
        description: `Please ensure the following profile details are complete in the Smart Calorie Planner: ${missingFields.join(
          ', '
        )}.`,
        variant: 'destructive',
        duration: 7000,
      });
      setOptimizingMealKey(null);
      return;
    }

    try {
      const dailyTargets = {
        targetCalories:
          profileData.smartPlannerData?.formValues?.custom_total_calories,
        targetProtein: profileData.smartPlannerData?.formValues?.proteinGrams,
        targetCarbs: profileData.smartPlannerData?.formValues?.carbGrams,
        targetFat: profileData.smartPlannerData?.formValues?.fatGrams,
      };

      if (
        !dailyTargets.targetCalories ||
        !dailyTargets.targetProtein ||
        !dailyTargets.targetCarbs ||
        !dailyTargets.targetFat
      ) {
        toast({
          title: 'Calculation Error',
          description:
            'Could not calculate daily targets from profile. Ensure profile is complete. This might happen if some values are zero or invalid.',
          variant: 'destructive',
        });
        setOptimizingMealKey(null);
        return;
      }

      const aiInput = getAdjustedMealInput(
        profileData,
        dailyTargets,
        mealToOptimize
      );

      const result = await adjustMealIngredients(aiInput);
      if (!result.adjustedMeal || !user?.uid)
        throw new Error(
          'AI did not return an adjusted meal or an unexpected format was received.'
        );

      const newWeeklyPlan = JSON.parse(JSON.stringify(weeklyPlan));
      const updatedMealData = {
        ...result.adjustedMeal,
        id: mealToOptimize.id,
        totalCalories:
          result.adjustedMeal.totalCalories != null
            ? Number(result.adjustedMeal.totalCalories)
            : null,
        totalProtein:
          result.adjustedMeal.totalProtein != null
            ? Number(result.adjustedMeal.totalProtein)
            : null,
        totalCarbs:
          result.adjustedMeal.totalCarbs != null
            ? Number(result.adjustedMeal.totalCarbs)
            : null,
        totalFat:
          result.adjustedMeal.totalFat != null
            ? Number(result.adjustedMeal.totalFat)
            : null,
        ingredients: result.adjustedMeal.ingredients.map((ing) => ({
          ...ing,
          quantity: ing.quantity != null ? Number(ing.quantity) : 0,
          calories: ing.calories != null ? Number(ing.calories) : null,
          protein: ing.protein != null ? Number(ing.protein) : null,
          carbs: ing.carbs != null ? Number(ing.carbs) : null,
          fat: ing.fat != null ? Number(ing.fat) : null,
        })),
      };

      newWeeklyPlan.days[dayIndex].meals[mealIndex] = updatedMealData;
      setWeeklyPlan(newWeeklyPlan);
      await saveMealPlanData(user.uid, newWeeklyPlan);

      toast({
        title: `Meal Optimized: ${mealToOptimize.name}`,
        description: result.explanation || 'AI has adjusted the ingredients.',
      });
    } catch (error: any) {
      console.error('Error optimizing meal:', error);
      console.error('Full AI error object:', error);
      const errorMessage =
        error.message || 'Unknown error during optimization.';
      toast({
        title: 'Optimization Failed',
        description: `Could not optimize meal: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setOptimizingMealKey(null);
    }
  };

  if (isLoadingPlan || (user && isLoadingProfile)) return <LoadingScreen />;

  return (
    <div className='container mx-auto py-8'>
      <Card className='shadow-xl'>
        <SectionHeader
          className='text-3xl font-bold'
          title='Your Current Weekly Meal Plan'
          description='View and manage your meals for the week. Click on a meal to edit or
          optimize with AI.'
        />
        <CardContent>
          <Tabs
            defaultValue={getQueryParams('selected_day') ?? daysOfWeek[0]}
            className='w-full'
          >
            <ScrollArea className='w-full whitespace-nowrap rounded-md'>
              <TabsList className='inline-flex h-auto'>
                {daysOfWeek.map((day) => (
                  <TabsTrigger
                    onClick={() => updateQueryParams('selected_day', day)}
                    key={day}
                    value={day}
                    className='px-4 py-2 text-base'
                  >
                    {day}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation='horizontal' />
            </ScrollArea>

            {weeklyPlan.days.map((dayPlan, dayIndex) => (
              <TabsContent
                key={dayPlan.dayOfWeek}
                value={dayPlan.dayOfWeek}
                className='mt-6'
              >
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {dayPlan.meals.map((meal, mealIndex) => (
                    <MealCardItem
                      key={mealIndex}
                      meal={meal}
                      dayPlan={dayPlan}
                      mealIndex={mealIndex}
                      dayIndex={dayIndex}
                      disabled={isLoadingProfile}
                      optimizingKey={optimizingMealKey}
                      onEditMeal={handleEditMeal}
                      onOptimizeMeal={handleOptimizeMeal}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {editingMeal && (
        <EditMealDialog
          meal={editingMeal.meal}
          onSave={handleSaveMeal}
          onClose={() => setEditingMeal(null)}
        />
      )}
    </div>
  );
}
