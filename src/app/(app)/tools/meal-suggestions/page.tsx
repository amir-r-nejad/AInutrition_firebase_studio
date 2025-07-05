import LoadingScreen from '@/components/ui/LoadingScreen';
import MealSuggestionsContent from '@/features/tools/components/meal-suggestions/MealSuggestionsContent';
import { Suspense } from 'react';

export default function MealSuggestionsPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <MealSuggestionsContent />
    </Suspense>
  );
}
