'use client';

import LoadingScreen from '@/components/ui/LoadingScreen';
import MealSuggestionsContent from '@/features/meal-suggestions/components/MealSuggestionsContent';
import { Suspense } from 'react';

export default function MealSuggestionsPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <MealSuggestionsContent />
    </Suspense>
  );
}
