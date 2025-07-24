
import { Suspense } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import WorkoutPlannerSection from '@/features/tools/components/workout-planner/WorkoutPlannerSection';

export default function WorkoutPlannerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <Suspense fallback={<LoadingScreen />}>
        <WorkoutPlannerSection />
      </Suspense>
    </div>
  );
}
