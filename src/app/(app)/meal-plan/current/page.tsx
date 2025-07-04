
'use client';

import {
  adjustMealIngredients,
  type AdjustMealIngredientsInput,
  type AdjustMealIngredientsOutput,
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  daysOfWeek,
  defaultMacroPercentages,
  mealNames,
} from '@/lib/constants';
import { db } from '@/lib/firebase/clientApp';
import { calculateEstimatedDailyTargets } from '@/lib/nutrition-calculator';
import type {
  FullProfileType,
  Ingredient,
  Meal,
  WeeklyMealPlan,
} from '@/lib/schemas';
import { preprocessDataForFirestore } from '@/lib/schemas';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2, Pencil, PlusCircle, Trash2, Wand2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const generateInitialWeeklyPlan = (): WeeklyMealPlan => ({
  days: daysOfWeek.map((day) => ({
    dayOfWeek: day,
    meals: mealNames.map((mealName) => ({
      name: mealName,
      customName: '',
      ingredients: [],
      totalCalories: null,
      totalProtein: null,
      totalCarbs: null,
      totalFat: null,
    })),
  })),
});

// Helper function to safely convert values to numbers or a fallback
const safeConvertToNumber = (value: any, fallback: number | null = null) => {
    if (value === null || value === undefined || value === '') {
        return fallback;
    }
    const num = Number(value);
    return isNaN(num) ? fallback : num;
};


export default function CurrentMealPlanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyMealPlan>(
    generateInitialWeeklyPlan()
  );
  const [editingMeal, setEditingMeal] = useState<{
    dayIndex: number;
    mealIndex: number;
    meal: Meal;
  } | null>(null);
  const [optimizingMealKey, setOptimizingMealKey] = useState<string | null>(
    null
  );
  const [profileData, setProfileData] =
    useState<FullProfileType | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      setIsLoadingPlan(true);
      setIsLoadingProfile(true);

      // Client-side fetch for both profile and meal plan
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const fullProfile = docSnap.data() as FullProfileType;
            setProfileData(fullProfile);
            if (fullProfile.currentWeeklyPlan) {
              setWeeklyPlan(fullProfile.currentWeeklyPlan);
            } else {
              setWeeklyPlan(generateInitialWeeklyPlan());
            }
          } else {
            setProfileData(null);
            setWeeklyPlan(generateInitialWeeklyPlan());
          }
        })
        .catch((error) => {
          toast({
            title: 'Error Loading Data',
            description: error instanceof Error ? error.message : 'Could not load your data.',
            variant: 'destructive',
          });
          setWeeklyPlan(generateInitialWeeklyPlan());
        })
        .finally(() => {
            setIsLoadingPlan(false);
            setIsLoadingProfile(false);
        });

    } else {
      setIsLoadingPlan(false);
      setIsLoadingProfile(false);
      setWeeklyPlan(generateInitialWeeklyPlan());
    }
  }, [user, toast]);

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
      // Client-side Firestore write
      const sanitizedPlan = preprocessDataForFirestore(newWeeklyPlan);
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { currentWeeklyPlan: sanitizedPlan }, { merge: true });

      toast({
        title: 'Meal Saved',
        description: `${
          updatedMeal.customName || updatedMeal.name
        } has been updated.`,
      });
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'Could not save meal plan.';
      toast({
        title: 'Save Error',
        description: errorMessage,
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

    const smartPlannerValues = profileData.smartPlannerData?.formValues;
    const requiredFields: (keyof typeof smartPlannerValues)[] = [
      'age',
      'gender',
      'current_weight',
      'height_cm',
      'activity_factor_key',
      'dietGoal',
    ];
    
    const missingFields = requiredFields.filter(
        (field) => !smartPlannerValues?.[field]
    );

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
      const dailyTargets = calculateEstimatedDailyTargets({
        age: smartPlannerValues.age!,
        gender: smartPlannerValues.gender!,
        currentWeight: smartPlannerValues.current_weight!,
        height: smartPlannerValues.height_cm!,
        activityLevel: smartPlannerValues.activity_factor_key!,
        dietGoal: smartPlannerValues.dietGoal!,
      });
      
      if (
        !dailyTargets.finalTargetCalories ||
        !dailyTargets.proteinGrams ||
        !dailyTargets.carbGrams ||
        !dailyTargets.fatGrams
      ) {
        toast({
          title: 'Calculation Error',
          description:
            'Could not calculate daily targets from profile. Ensure profile is complete.',
          variant: 'destructive',
        });
        setOptimizingMealKey(null);
        return;
      }

      const mealDistribution = defaultMacroPercentages[mealToOptimize.name] || {
        calories_pct: 0,
        protein_pct: 0,
        carbs_pct: 0,
        fat_pct: 0,
      };

      const targetMacrosForMeal = {
        calories: Math.round(
          dailyTargets.finalTargetCalories * (mealDistribution.calories_pct / 100)
        ),
        protein: Math.round(
          dailyTargets.proteinGrams * (mealDistribution.protein_pct / 100)
        ),
        carbs: Math.round(
          dailyTargets.carbGrams * (mealDistribution.carbs_pct / 100)
        ),
        fat: Math.round(
          dailyTargets.fatGrams * (mealDistribution.fat_pct / 100)
        ),
      };

      const preparedIngredients = mealToOptimize.ingredients.map((ing) => ({
        name: ing.name,
        quantity: Number(ing.quantity) || 0,
        unit: ing.unit,
        calories: Number(ing.calories) || 0,
        protein: Number(ing.protein) || 0,
        carbs: Number(ing.carbs) || 0,
        fat: Number(ing.fat) || 0,
      }));

      const aiInput: AdjustMealIngredientsInput = {
        originalMeal: {
          name: mealToOptimize.name,
          customName: mealToOptimize.customName || '',
          ingredients: preparedIngredients,
          totalCalories: Number(mealToOptimize.totalCalories) || 0,
          totalProtein: Number(mealToOptimize.totalProtein) || 0,
          totalCarbs: Number(mealToOptimize.totalCarbs) || 0,
          totalFat: Number(mealToOptimize.totalFat) || 0,
        },
        targetMacros: targetMacrosForMeal,
        userProfile: {
          age: profileData.age ?? undefined,
          gender: profileData.gender ?? undefined,
          activityLevel: profileData.activityLevel ?? undefined,
          dietGoal: profileData.dietGoalOnboarding ?? undefined,
          preferredDiet: profileData.preferredDiet ?? undefined,
          allergies: profileData.allergies ?? [],
          dispreferredIngredients: profileData.dispreferredIngredients ?? [],
          preferredIngredients: profileData.preferredIngredients ?? [],
        },
      };

      const result = await adjustMealIngredients(aiInput);

      if (result.adjustedMeal && user?.uid) {
        const newWeeklyPlan = JSON.parse(JSON.stringify(weeklyPlan));
        const updatedMealData = {
            ...result.adjustedMeal,
            id: mealToOptimize.id,
            totalCalories: safeConvertToNumber(result.adjustedMeal.totalCalories),
            totalProtein: safeConvertToNumber(result.adjustedMeal.totalProtein),
            totalCarbs: safeConvertToNumber(result.adjustedMeal.totalCarbs),
            totalFat: safeConvertToNumber(result.adjustedMeal.totalFat),
            ingredients: result.adjustedMeal.ingredients.map((ing) => ({
                ...ing,
                quantity: safeConvertToNumber(ing.quantity, 0),
                calories: safeConvertToNumber(ing.calories),
                protein: safeConvertToNumber(ing.protein),
                carbs: safeConvertToNumber(ing.carbs),
                fat: safeConvertToNumber(ing.fat),
            })),
        };
        newWeeklyPlan.days[dayIndex].meals[mealIndex] = updatedMealData;
        setWeeklyPlan(newWeeklyPlan);
        
        // Client-side Firestore write
        const sanitizedPlan = preprocessDataForFirestore(newWeeklyPlan);
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { currentWeeklyPlan: sanitizedPlan }, { merge: true });

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
      const errorMessage =
        error.message || 'Unknown error during optimization.';
      toast({
        title: 'Optimization Failed',
        description: `Could not optimize meal. Details: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setOptimizingMealKey(null);
    }
  };

  if (isLoadingPlan || (user && isLoadingProfile)) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Loader2 className='h-12 w-12 animate-spin text-primary' />
        <p className='ml-4 text-lg'>Loading data...</p>
      </div>
    );
  }

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
          <Tabs defaultValue={daysOfWeek[0]} className='w-full'>
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

interface EditMealDialogProps {
  meal: Meal;
  onSave: (updatedMeal: Meal) => void;
  onClose: () => void;
}

function EditMealDialog({
  meal: initialMeal,
  onSave,
  onClose,
}: EditMealDialogProps) {
  const [meal, setMeal] = useState<Meal>(
    JSON.parse(JSON.stringify(initialMeal))
  );

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string | number
  ) => {
    const newIngredients = [...meal.ingredients];
    const targetIngredient = { ...newIngredients[index] };

    if (
      field === 'quantity' ||
      field === 'calories' ||
      field === 'protein' ||
      field === 'carbs' ||
      field === 'fat'
    ) {
      const numValue = Number(value);
      (targetIngredient as any)[field] =
        value === '' || value === undefined || Number.isNaN(numValue)
          ? null
          : numValue;
    } else {
      (targetIngredient as any)[field] = value;
    }
    newIngredients[index] = targetIngredient;
    setMeal((prev) => ({ ...prev, ingredients: newIngredients }));
  };

  const addIngredient = () => {
    setMeal((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          name: '',
          quantity: null,
          unit: 'g',
          calories: null,
          protein: null,
          carbs: null,
          fat: null,
        },
      ],
    }));
  };

  const removeIngredient = (index: number) => {
    setMeal((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const calculateTotals = useCallback(() => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    meal.ingredients.forEach((ing) => {
      totalCalories += Number(ing.calories) || 0;
      totalProtein += Number(ing.protein) || 0;
      totalCarbs += Number(ing.carbs) || 0;
      totalFat += Number(ing.fat) || 0;
    });
    setMeal((prev) => ({
      ...prev,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
    }));
  }, [meal.ingredients]);

  useEffect(() => {
    calculateTotals();
  }, [meal.ingredients, calculateTotals]);

  const handleSubmit = () => {
    let finalTotalCalories = 0,
      finalTotalProtein = 0,
      finalTotalCarbs = 0,
      finalTotalFat = 0;
    meal.ingredients.forEach((ing) => {
      finalTotalCalories += Number(ing.calories) || 0;
      finalTotalProtein += Number(ing.protein) || 0;
      finalTotalCarbs += Number(ing.carbs) || 0;
      finalTotalFat += Number(ing.fat) || 0;
    });

    const mealToSave: Meal = {
      ...meal,
      totalCalories: finalTotalCalories,
      totalProtein: finalTotalProtein,
      totalCarbs: finalTotalCarbs,
      totalFat: finalTotalFat,
    };
    onSave(mealToSave);
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            Edit {initialMeal.name}
            {initialMeal.customName ? ` - ${initialMeal.customName}` : ''}
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2'>
          <div>
            <Label htmlFor='customMealName'>
              Meal Name (e.g., Chicken Salad)
            </Label>
            <Input
              id='customMealName'
              value={meal.customName || ''}
              onChange={(e) => setMeal({ ...meal, customName: e.target.value })}
              placeholder='Optional: e.g., Greek Yogurt with Berries'
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
            />
          </div>
          <Label>Ingredients</Label>
          {meal.ingredients.map((ing, index) => (
            <Card key={index} className='p-3 space-y-2'>
              <div className='flex justify-between items-center gap-2'>
                <Input
                  placeholder='Ingredient Name'
                  value={ing.name}
                  onChange={(e) =>
                    handleIngredientChange(index, 'name', e.target.value)
                  }
                  className='flex-grow'
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => removeIngredient(index)}
                  className='shrink-0'
                >
                  {' '}
                  <Trash2 className='h-4 w-4 text-destructive' />{' '}
                </Button>
              </div>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                <Input
                  type='number'
                  placeholder='Qty'
                  value={ing.quantity ?? ''}
                  onChange={(e) =>
                    handleIngredientChange(index, 'quantity', e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <Input
                  placeholder='Unit (g, ml, item)'
                  value={ing.unit}
                  onChange={(e) =>
                    handleIngredientChange(index, 'unit', e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <div className='col-span-2 md:col-span-1 text-xs text-muted-foreground pt-2'>
                  {' '}
                  (Total for this quantity){' '}
                </div>
              </div>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                <Input
                  type='number'
                  placeholder='Cals'
                  value={ing.calories ?? ''}
                  onChange={(e) =>
                    handleIngredientChange(index, 'calories', e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <Input
                  type='number'
                  placeholder='Protein (g)'
                  value={ing.protein ?? ''}
                  onChange={(e) =>
                    handleIngredientChange(index, 'protein', e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <Input
                  type='number'
                  placeholder='Carbs (g)'
                  value={ing.carbs ?? ''}
                  onChange={(e) =>
                    handleIngredientChange(index, 'carbs', e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <Input
                  type='number'
                  placeholder='Fat (g)'
                  value={ing.fat ?? ''}
                  onChange={(e) =>
                    handleIngredientChange(index, 'fat', e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
              </div>
            </Card>
          ))}
          <Button variant='outline' onClick={addIngredient} className='w-full'>
            {' '}
            <PlusCircle className='mr-2 h-4 w-4' /> Add Ingredient{' '}
          </Button>
          <div className='mt-4 p-3 border rounded-md bg-muted/50'>
            <h4 className='font-semibold mb-1'>Calculated Totals:</h4>
            <p className='text-sm'>
              Calories: {meal.totalCalories?.toFixed(0) ?? '0'}
            </p>
            <p className='text-sm'>
              Protein: {meal.totalProtein?.toFixed(1) ?? '0.0'}g
            </p>
            <p className='text-sm'>
              Carbs: {meal.totalCarbs?.toFixed(1) ?? '0.0'}g
            </p>
            <p className='text-sm'>
              Fat: {meal.totalFat?.toFixed(1) ?? '0.0'}g
            </p>
            <Button
              onClick={calculateTotals}
              size='sm'
              variant='ghost'
              className='mt-1 text-xs'
            >
              Recalculate Manually
            </Button>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button type='button' onClick={handleSubmit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
