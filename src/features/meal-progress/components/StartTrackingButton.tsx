'use client';

import { Button } from '@/components/ui/button';
import { Meal } from '@/lib/schemas';
import { Edit, Plus } from 'lucide-react';
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

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant={isTracked ? 'outline' : 'default'}
        size='sm'
        className='w-full mt-4'
      >
        {isTracked ? (
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

      {isOpen && (
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
