'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useQueryParams } from '@/hooks/useQueryParams';
import { Meal } from '@/lib/schemas';
import { Loader2, Pencil, Wand2 } from 'lucide-react';

type MealCardItemProps = {
  meal: Meal;
  dayPlan: any;
  dayIndex: number;
  mealIndex: number;
  optimizingKey: string | null;
  onOptimizeMeal: (dayIndex: number, mealIndex: number) => Promise<void>;
};

function MealCardItem({
  meal,
  dayPlan,
  dayIndex,
  mealIndex,
  optimizingKey,
  onOptimizeMeal,
}: MealCardItemProps) {
  const { updateQueryParams } = useQueryParams();

  const mealKey = `${dayPlan.day_of_week}-${meal.name}-${mealIndex}`;
  const isOptimizing = optimizingKey === mealKey;

  return (
    <Card className='flex flex-col'>
      <CardHeader>
        <CardTitle className='text-xl'>{meal.name}</CardTitle>
        {meal.custom_name && (
          <CardDescription>{meal.custom_name}</CardDescription>
        )}
      </CardHeader>
      <CardContent className='flex-grow'>
        {meal.ingredients.length > 0 ? (
          <ul className='space-y-1 text-sm text-muted-foreground'>
            {meal.ingredients.map((ing, ingIndex) => (
              <li key={ingIndex}>
                {ing.name} - {ing.quantity?.toFixed(2)}
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
          <p>Calories: {meal.total_calories?.toFixed(0) ?? 'N/A'}</p>
          <p>Protein: {meal.total_protein?.toFixed(1) ?? 'N/A'}g</p>
          <p>Carbs: {meal.total_carbs?.toFixed(1) ?? 'N/A'}g</p>
          <p>Fat: {meal.total_fat?.toFixed(1) ?? 'N/A'}g</p>
        </div>
      </CardContent>
      <CardFooter className='border-t pt-4 flex-wrap gap-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() =>
            updateQueryParams(
              ['selected_day', 'selected_meal', 'is_edit'],
              [dayPlan.day_of_week, meal.name, 'true']
            )
          }
          disabled={isOptimizing}
        >
          <Pencil className='mr-2 h-4 w-4' /> Edit Meal
        </Button>
        <Button
          variant='default'
          size='sm'
          onClick={() => onOptimizeMeal(dayIndex, mealIndex)}
          disabled={isOptimizing}
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
}

export default MealCardItem;
