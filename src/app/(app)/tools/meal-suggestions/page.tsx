'use client';

import MealSuggestionsContent from '@/features/meal-suggestions/components/MealSuggestionsContent';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export default function MealSuggestionsPage() {
  return (
    <Suspense
      fallback={
        <div className='flex justify-center items-center h-screen'>
          <Loader2 className='h-12 w-12 animate-spin text-primary' />
          <p className='ml-4 text-lg'>Loading...</p>
        </div>
      }
    >
      <MealSuggestionsContent />
    </Suspense>
  );
}
