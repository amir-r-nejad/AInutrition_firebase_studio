'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Meal, MealNameType } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';
import { MealProgressEntry } from '../types';
import StartTrackingButton from './StartTrackingButton';

type MealCardProps = {
  mealType: MealNameType;
  meal: Meal;
  progressMeal?: MealProgressEntry;
};

export function MealCard({ mealType, meal, progressMeal }: MealCardProps) {
  const isTracked = !!progressMeal;
  const followedPlan = progressMeal?.followed_plan;

  return (
    <Card
      className={cn(
        'flex flex-col h-full',
        isTracked && followedPlan && 'border-secondary',
        isTracked && !followedPlan && 'border-destructive',
        !isTracked && 'border-border'
      )}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg flex items-center gap-2'>
            {mealType}
          </CardTitle>

          <div className='flex items-center gap-2'>
            {!isTracked && <Badge variant='outline'>Not Tracked</Badge>}

            {isTracked && followedPlan && (
              <Badge variant='default'>Followed Plan</Badge>
            )}

            {isTracked && !followedPlan && (
              <Badge variant='destructive'>Custom Meal</Badge>
            )}

            {isTracked && followedPlan && (
              <CheckCircle className='h-4 w-4 text-primary' />
            )}

            {isTracked && !followedPlan && (
              <XCircle className='h-4 w-4 text-destructive' />
            )}
          </div>
        </div>
        <div className='flex items-center justify-between'>
          <CardDescription className='text-sm'>
            {meal?.custom_name || 'No meal planned'}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className='flex-1 flex flex-col p-4'>
        <div className='flex-1 space-y-4'>
          {meal && (
            <div className='space-y-2'>
              <h4 className='font-medium text-sm text-primary'>
                Planned Meal:
              </h4>
              <div className='space-y-1'>
                {meal.ingredients.map((ing, i) => (
                  <p key={i} className='text-xs text-muted-foreground'>
                    • {ing.name} - {ing.quantity} {ing.unit}
                  </p>
                ))}
              </div>
              <div className='flex justify-between text-xs bg-muted/50 p-2 rounded'>
                <span>{meal.total_calories} kcal</span>
                <span>P: {meal.total_protein}g</span>
                <span>C: {meal.total_carbs}g</span>
                <span>F: {meal.total_fat}g</span>
              </div>
            </div>
          )}

          {isTracked && (
            <div className='space-y-2 border-t pt-3'>
              <h4 className='font-medium text-sm text-secondary'>
                Actually Consumed:
              </h4>

              {followedPlan ? (
                <p className='text-sm text-primary'>
                  ✓ Followed the planned meal
                </p>
              ) : (
                <div className='space-y-1'>
                  {progressMeal.custom_ingredients?.map((ingredient, index) => (
                    <p key={index} className='text-xs text-muted-foreground'>
                      • {ingredient.name} - {ingredient.quantity}
                    </p>
                  ))}
                  {progressMeal.note && (
                    <div className='text-xs bg-muted py-2 px-3 rounded-lg'>
                      Note:{' '}
                      <span className='font-medium'>
                        &quot;{progressMeal.note}&quot;
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className='flex justify-between text-xs bg-secondary/10 p-2 rounded'>
                <span>{progressMeal.consumed_calories} kcal</span>
                <span>P: {progressMeal.consumed_protein}g</span>
                <span>C: {progressMeal.consumed_carbs}g</span>
                <span>F: {progressMeal.consumed_fat}g</span>
              </div>
            </div>
          )}
        </div>

        <StartTrackingButton meal={meal} progressMeal={progressMeal} />
      </CardContent>
    </Card>
  );
}
