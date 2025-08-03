'use client';

import { Button } from '@/components/ui/button';
import { Meal } from '@/lib/schemas';
import { Ban, Edit, Plus } from 'lucide-react';
import { useState } from 'react';
import { MealProgressEntry } from '../types';
import { TrackMealModal } from './TrackMealModal';

type StartTrackingButtonProps = {
  meal: Meal;
  progressMeal?: MealProgressEntry;
};

function StartTrackingButton({ meal, progressMeal }: StartTrackingButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isTracked = !!progressMeal;

  const isTrackingDisabled =
    !meal.total_calories || meal.ingredients.length === 0;

  return (
    <>
      <Button
        disabled={isTrackingDisabled}
        onClick={() => setIsOpen(() => !isTrackingDisabled && true)}
        variant={
          isTrackingDisabled ? 'secondary' : isTracked ? 'outline' : 'default'
        }
        size='sm'
        className='w-full mt-4'
      >
        {isTrackingDisabled ? (
          <>
            <Ban className='h-4 w-4' />
            Tracking Unavailable
          </>
        ) : isTracked ? (
          <>
            <Edit className='h-4 w-4' />
            Edit Tracking
          </>
        ) : (
          <>
            <Plus className='h-4 w-4' />
            Start Tracking
          </>
        )}
      </Button>

      {!isTrackingDisabled && isOpen && (
        <TrackMealModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          meal={meal}
          progressMeal={progressMeal}
        />
      )}
    </>
  );
}

export default StartTrackingButton;
