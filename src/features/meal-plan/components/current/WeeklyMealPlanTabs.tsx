'use client';

import { adjustMealIngredients } from '@/ai/flows/adjust-meal-ingredients';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MealCardItem from '@/features/meal-plan/components/current/MealCardItem';
import { editMealPlan } from '@/features/meal-plan/lib/data-service';
import { getAdjustedMealInput } from '@/features/meal-plan/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useQueryParams } from '@/hooks/useQueryParams';
import { daysOfWeek } from '@/lib/constants';
import { BaseProfileData, MealPlans, UserPlanType } from '@/lib/schemas';
import { useState } from 'react';

function WeeklyMealPlanTabs({
  profile,
  plan,
  mealPlan,
}: {
  profile: BaseProfileData;
  plan: UserPlanType;
  mealPlan: MealPlans;
}) {
  const { toast } = useToast();
  const { getQueryParams, updateAndRemoveQueryParams } = useQueryParams();

  const [optimizingMealKey, setOptimizingMealKey] = useState<string | null>(
    null
  );
  const [mealPlanState, setMealPlanState] = useState<MealPlans | null>(
    mealPlan
  );

  async function handleOptimizeMeal(dayIndex: number, mealIndex: number) {
    const { meal_data } = mealPlan;

    const mealToOptimize = meal_data.days[dayIndex].meals[mealIndex];
    const mealKey = `${meal_data.days[dayIndex].day_of_week}-${mealToOptimize.name}-${mealIndex}`;
    setOptimizingMealKey(mealKey);

    try {
      const dailyTargets = {
        targetCalories:
          plan.custom_total_calories ?? plan.target_daily_calories,
        targetProtein: plan.custom_protein_g ?? plan.target_protein_g,
        targetCarbs: plan.custom_carbs_g ?? plan.target_carbs_g,
        targetFat: plan.custom_fat_g ?? plan.target_fat_g,
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
        profile,
        dailyTargets,
        mealToOptimize
      );

      const result = await adjustMealIngredients(aiInput);
      if (!result.adjustedMeal)
        throw new Error(
          'AI did not return an adjusted meal or an unexpected format was received.'
        );

      const newWeeklyPlan = meal_data;
      const updatedMealData = {
        ...result.adjustedMeal,
        total_calories: result.adjustedMeal.total_calories
          ? Number(result.adjustedMeal.total_calories)
          : null,
        total_protein: result.adjustedMeal.total_protein
          ? Number(result.adjustedMeal.total_protein)
          : null,
        total_carbs: result.adjustedMeal.total_carbs
          ? Number(result.adjustedMeal.total_carbs)
          : null,
        total_fat: result.adjustedMeal.total_fat
          ? Number(result.adjustedMeal.total_fat)
          : null,
        ingredients: result.adjustedMeal.ingredients.map((ing) => ({
          ...ing,
          quantity: ing.quantity ? Number(ing.quantity) : 0,
          calories: ing.calories ? Number(ing.calories) : null,
          protein: ing.protein ? Number(ing.protein) : null,
          carbs: ing.carbs ? Number(ing.carbs) : null,
          fat: ing.fat ? Number(ing.fat) : null,
        })),
      };

      newWeeklyPlan.days[dayIndex].meals[mealIndex] = updatedMealData;

      await editMealPlan({ meal_data: newWeeklyPlan });
      setMealPlanState((meal) => ({ ...meal!, meal_data: newWeeklyPlan }));

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
  }

  return (
    <Tabs
      defaultValue={getQueryParams('selected_day') ?? daysOfWeek[0]}
      className='w-full'
    >
      <ScrollArea className='w-full whitespace-nowrap rounded-md'>
        <TabsList className='inline-flex h-auto'>
          {daysOfWeek.map((day) => (
            <TabsTrigger
              onClick={() => {
                updateAndRemoveQueryParams({ selected_day: day }, [
                  'selected_meal',
                  'is_edit',
                ]);
              }}
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

      {mealPlanState?.meal_data.days.map((dayPlan, dayIndex) => (
        <TabsContent
          key={dayPlan.day_of_week}
          value={dayPlan.day_of_week}
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
                optimizingKey={optimizingMealKey}
                onOptimizeMeal={handleOptimizeMeal}
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export default WeeklyMealPlanTabs;
