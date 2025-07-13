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
import type { Ingredient, Meal } from '@/lib/schemas';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EditMealDialogProps } from '../../types';

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
    console.log(index, field, value);

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
                  (Total for this quantity)
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
            <PlusCircle className='mr-2 h-4 w-4' /> Add Ingredient
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

export default EditMealDialog;
