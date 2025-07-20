'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { useQueryParams } from '@/hooks/useQueryParams';
import type { Ingredient, Meal, MealPlans } from '@/lib/schemas';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { editMealPlan } from '../../lib/data-service';

function EditMealDialog({ mealPlan }: { mealPlan: MealPlans }) {
  const { toast } = useToast();

  const { getQueryParams, removeQueryParams } = useQueryParams();

  const [meal, setMeal] = useState<Meal | null>(null);

  function handleIngredientChange(
    index: number,
    field: keyof Ingredient,
    value: string | number
  ) {
    if (!meal) return null;

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
    setMeal((prev) => ({ ...prev!, ingredients: newIngredients }));
  }

  function addIngredient() {
    setMeal((prev) => ({
      ...prev!,
      ingredients: [
        ...(prev?.ingredients ?? []),
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
  }

  function removeIngredient(index: number) {
    setMeal((prev) => ({
      ...prev!,
      ingredients: prev ? prev.ingredients.filter((_, i) => i !== index) : [],
    }));
  }

  async function handleSubmit() {
    if (!meal) return null;

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
      total_calories: finalTotalCalories,
      total_protein: finalTotalProtein,
      total_carbs: finalTotalCarbs,
      total_fat: finalTotalFat,
    };

    const { meal_data } = mealPlan;

    const selectedDay = mealPlan.meal_data.days
      .filter((plan) => plan.day_of_week === getQueryParams('selected_day'))
      .at(0);

    const dayIndex = mealPlan?.meal_data.days.findIndex(
      (plan) => plan.day_of_week === getQueryParams('selected_day')
    );

    const mealIndex = selectedDay?.meals.findIndex(
      (meal) => meal.name === getQueryParams('selected_meal')
    ) as number;

    const newWeeklyPlan = meal_data;
    newWeeklyPlan.days[dayIndex].meals[mealIndex] = mealToSave;

    try {
      await editMealPlan({ meal_data: newWeeklyPlan });
      toast({
        title: 'Meal Saved',
        description: `${meal.custom_name || meal.name} has been updated.`,
      });
      removeQueryParams(['selected_meal', 'is_edit']);
    } catch {
      toast({
        title: 'Save Error',
        description: 'Could not save meal plan.',
        variant: 'destructive',
      });
    }
  }

  const calculateTotals = useCallback(() => {
    const totalMacros = meal?.ingredients.reduce(
      function (acc, ing) {
        return {
          total_calories: (acc.total_protein += Number(ing.calories) || 0),
          total_protein: (acc.total_protein += Number(ing.protein) || 0),
          total_carbs: (acc.total_carbs += Number(ing.carbs) || 0),
          total_fat: (acc.total_fat += Number(ing.fat) || 0),
        };
      },
      {
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
      }
    );

    setMeal((prev) => ({ ...prev!, ...totalMacros }));
  }, [meal?.ingredients]);

  useEffect(function () {
    const selectedDay = mealPlan.meal_data.days
      .filter((plan) => plan.day_of_week === getQueryParams('selected_day'))
      .at(0);
    const selectedMeal = selectedDay?.meals
      .filter((meal) => meal.name === getQueryParams('selected_meal'))
      .at(0);

    if (!selectedMeal) return;
    setMeal(selectedMeal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  if (!meal) return;

  return (
    <Dialog
      open={true}
      onOpenChange={(isOpen) =>
        !isOpen && removeQueryParams(['selected_meal', 'is_edit'])
      }
    >
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            Edit {meal.name}
            {meal.custom_name ? ` - ${meal.custom_name}` : ''}
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2'>
          <div>
            <Label htmlFor='customMealName'>
              Meal Name (e.g., Chicken Salad)
            </Label>
            <Input
              id='customMealName'
              value={meal.custom_name || ''}
              onChange={(e) =>
                setMeal({ ...meal, custom_name: e.target.value })
              }
              placeholder='Optional: e.g., Greek Yogurt with Berries'
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
            />
          </div>
          <Label>Ingredients</Label>
          {meal?.ingredients.map((ing, index) => (
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
                    handleIngredientChange(index, 'quantity', +e.target.value)
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
                  (Total for this quantity)
                </div>
              </div>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                <Input
                  type='number'
                  placeholder='Cals'
                  value={ing.calories ?? ''}
                  onChange={(e) =>
                    handleIngredientChange(index, 'calories', +e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <Input
                  type='number'
                  placeholder='Protein (g)'
                  value={ing.protein ?? ''}
                  onChange={(e) =>
                    handleIngredientChange(index, 'protein', +e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <Input
                  type='number'
                  placeholder='Carbs (g)'
                  value={ing.carbs ?? ''}
                  onChange={(e) =>
                    handleIngredientChange(index, 'carbs', +e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <Input
                  type='number'
                  placeholder='Fat (g)'
                  value={ing.fat ?? ''}
                  onChange={(e) =>
                    handleIngredientChange(index, 'fat', +e.target.value)
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
              </div>
            </Card>
          ))}
          <Button variant='outline' onClick={addIngredient} className='w-full'>
            <PlusCircle className='mr-2 h-4 w-4' /> Add Ingredient
          </Button>
          <div className='mt-4 p-3 border rounded-md bg-muted/50'>
            <h4 className='font-semibold mb-1'>Calculated Totals:</h4>
            <p className='text-sm'>
              Calories: {meal.total_calories?.toFixed(0) ?? '0'}
            </p>
            <p className='text-sm'>
              Protein: {meal.total_protein?.toFixed(1) ?? '0.0'}g
            </p>
            <p className='text-sm'>
              Carbs: {meal.total_carbs?.toFixed(1) ?? '0.0'}g
            </p>
            <p className='text-sm'>
              Fat: {meal.total_fat?.toFixed(1) ?? '0.0'}g
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
            <Button
              type='button'
              variant='outline'
              onClick={() => removeQueryParams(['selected_meal', 'is_edit'])}
            >
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

export default EditMealDialog;
