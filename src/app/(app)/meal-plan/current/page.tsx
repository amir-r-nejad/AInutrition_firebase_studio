
'use client';

import {
  adjustMealIngredients,
  type AdjustMealIngredientsInput,
} from '@/ai/flows/adjust-meal-ingredients';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import SectionHeader from '@/components/ui/SectionHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditMealDialog from '@/features/meal-plan/components/current/EditMealDialog';
import { useUserMealPlanData } from '@/features/meal-plan/hooks/useUserMealPlanData';
import { saveMealPlanData } from '@/features/meal-plan/lib/data-service';
import {
  getAdjustedMealInput,
  getMissingProfileFields,
} from '@/features/meal-plan/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  daysOfWeek,
  defaultMacroPercentages,
} from '@/lib/constants';
import { calculateEstimatedDailyTargets } from '@/lib/nutrition-calculator';
import type {
  FullProfileType,
  Meal,
} from '@/lib/schemas';
import { getAIApiErrorMessage, cn } from '@/lib/utils';
import { Loader2, Pencil, Wand2, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useAuth } from '@/features/auth/contexts/AuthContext';


export default function CurrentMealPlanPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
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
   const [activeDay, setActiveDay] = useState(daysOfWeek[0]);


  useEffect(() => {
    fetchMealPlan(() => {
      toast({
        title: 'Error',
        description: 'Could not load meal plan.',
        variant: 'destructive',
      });
    });
  }, [fetchMealPlan, toast]);

  const handleEditMeal = (dayIndex: number, mealIndex: number) => {
    if (!weeklyPlan) return;
    const mealToEdit = weeklyPlan.days[dayIndex].meals[mealIndex];
    setEditingMeal({
      dayIndex,
      mealIndex,
      meal: JSON.parse(JSON.stringify(mealToEdit)),
    });
  };

  const handleSaveMeal = async (updatedMeal: Meal) => {
    if (!editingMeal || !user?.uid || !weeklyPlan) return;

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
    } catch (error) {
       const errorMessage = getAIApiErrorMessage(error);
      toast({
        title: 'Save Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleOptimizeMeal = async (dayIndex: number, mealIndex: number) => {
    if (!weeklyPlan) return;
    const mealKey = `${weeklyPlan.days[dayIndex].dayOfWeek}-${mealIndex}`;
    setOptimizingMealKey(mealKey);

    const mealToOptimize = weeklyPlan.days[dayIndex].meals[mealIndex];

    if (isLoadingProfile || !profileData) {
      toast({
        title: 'Profile Data Loading',
        description: 'User profile data is still loading. Please wait a moment and try again.',
        variant: 'default',
      });
      setOptimizingMealKey(null);
      return;
    }

    const missingFields = getMissingProfileFields(profileData);

    if (missingFields.length > 0) {
      toast({
        title: 'Profile Incomplete for Optimization',
        description: `Please ensure the following profile details are complete in the Smart Calorie Planner: ${missingFields.join(', ')}.`,
        variant: 'destructive',
        duration: 7000,
      });
      setOptimizingMealKey(null);
      return;
    }

    try {
      const dailyTargets = calculateEstimatedDailyTargets({
        age: profileData.age!,
        gender: profileData.gender!,
        currentWeight: profileData.current_weight!,
        height: profileData.height_cm!,
        activityLevel: profileData.activityLevel!,
        dietGoal: profileData.dietGoalOnboarding!,
      });

      if (
        !dailyTargets.finalTargetCalories ||
        !dailyTargets.proteinGrams ||
        !dailyTargets.carbGrams ||
        !dailyTargets.fatGrams
      ) {
        toast({
          title: 'Calculation Error',
          description: 'Could not calculate daily targets from profile. Ensure profile is complete or use the Smart Calorie Planner.',
          variant: 'destructive',
        });
        setOptimizingMealKey(null);
        return;
      }
      
      const aiInput: AdjustMealIngredientsInput = getAdjustedMealInput(profileData, dailyTargets, mealToOptimize);

      const result = await adjustMealIngredients(aiInput);
      if (!result.adjustedMeal || !user?.uid)
        throw new Error(
          'AI did not return an adjusted meal or an unexpected format was received.'
        );

      if (result.adjustedMeal && user?.uid) {
        const newWeeklyPlan = JSON.parse(JSON.stringify(weeklyPlan));
        const updatedMealData = {
          ...result.adjustedMeal,
          id: mealToOptimize.id,
          totalCalories: Number(result.adjustedMeal.totalCalories) || null,
          totalProtein: Number(result.adjustedMeal.totalProtein) || null,
          totalCarbs: Number(result.adjustedMeal.totalCarbs) || null,
          totalFat: Number(result.adjustedMeal.totalFat) || null,
          ingredients: result.adjustedMeal.ingredients.map((ing) => ({
            ...ing,
            quantity: Number(ing.quantity) || 0,
            calories: Number(ing.calories) || null,
            protein: Number(ing.protein) || null,
            carbs: Number(ing.carbs) || null,
            fat: Number(ing.fat) || null,
          })),
        };
        newWeeklyPlan.days[dayIndex].meals[mealIndex] = updatedMealData;
        setWeeklyPlan(newWeeklyPlan);
        await saveMealPlanData(user.uid, newWeeklyPlan);
        toast({
          title: `Meal Optimized: ${mealToOptimize.name}`,
          description: result.explanation || 'AI has adjusted the ingredients.',
        });
      } else {
        throw new Error(
          'AI did not return an adjusted meal or an unexpected format was received.'
        );
      }
    } catch (error: any) {
      console.error('Error optimizing meal:', error);
      const errorMessage = getAIApiErrorMessage(error);
      toast({
        title: 'Optimization Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 8000,
      });
    } finally {
      setOptimizingMealKey(null);
    }
  };


  if (isLoadingPlan || (user && isLoadingProfile)) return <LoadingScreen />;

  return (
    <div className='container mx-auto py-8'>
      <Card className='shadow-xl'>
        <CardHeader>
          <CardTitle className='text-3xl font-bold'>
            Your Current Weekly Meal Plan
          </CardTitle>
          <CardDescription>
            View and manage your meals for the week. Click on a meal to edit or
            optimize with AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyPlan ? (
             <Tabs
                defaultValue={activeDay}
                className='w-full'
                onValueChange={setActiveDay}
              >
              <ScrollArea className='w-full whitespace-nowrap rounded-md'>
                <TabsList className='inline-flex h-auto'>
                  {daysOfWeek.map((day) => (
                    <TabsTrigger
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
                    {dayPlan.meals.map((meal, mealIndex) => {
                      const mealKey = `${dayPlan.dayOfWeek}-${meal.name}-${mealIndex}`;
                      const isOptimizing = optimizingMealKey === mealKey;
                      return (
                        <Card key={mealKey} className='flex flex-col'>
                          <CardHeader>
                            <CardTitle className='text-xl'>{meal.name}</CardTitle>
                            {meal.customName && (
                              <CardDescription>{meal.customName}</CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className='flex-grow'>
                            {meal.ingredients.length > 0 ? (
                              <ul className='space-y-1 text-sm text-muted-foreground'>
                                {meal.ingredients.map((ing, ingIndex) => (
                                  <li key={ingIndex}>
                                    {ing.name} - {ing.quantity}
                                    {ing.unit}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className='text-sm text-muted-foreground italic'>
                                No ingredients added yet.
                              </p>
                            )}
                            <div className='mt-2 text-xs space-y-0.5'>
                              <p>
                                Calories:{' '}
                                {meal.totalCalories?.toFixed(0) ?? 'N/A'}
                              </p>
                              <p>
                                Protein: {meal.totalProtein?.toFixed(1) ?? 'N/A'}g
                              </p>
                              <p>
                                Carbs: {meal.totalCarbs?.toFixed(1) ?? 'N/A'}g
                              </p>
                              <p>Fat: {meal.totalFat?.toFixed(1) ?? 'N/A'}g</p>
                            </div>
                          </CardContent>
                          <CardFooter className='border-t pt-4 flex-wrap gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleEditMeal(dayIndex, mealIndex)}
                              disabled={isOptimizing}
                            >
                              <Pencil className='mr-2 h-4 w-4' /> Edit Meal
                            </Button>
                            <Button
                              variant='default'
                              size='sm'
                              onClick={() =>
                                handleOptimizeMeal(dayIndex, mealIndex)
                              }
                              disabled={isOptimizing || isLoadingProfile}
                            >
                              {isOptimizing ? (
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              ) : (
                                <Wand2 className='mr-2 h-4 w-4' />
                              )}
                              {isOptimizing ? 'Optimizing...' : 'Optimize Meal'}
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
             <div className='text-center py-10 text-muted-foreground border rounded-lg'>
              <Info className='mx-auto h-10 w-10 mb-4 text-primary' />
              <p className='text-lg'>No meal plan found.</p>
              <p>You can add meals manually here, or generate a full plan using the AI Meal Plan tool.</p>
            </div>
          )}
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

