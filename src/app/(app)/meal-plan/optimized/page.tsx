import { Card } from '@/components/ui/card';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SectionHeader from '@/components/ui/SectionHeader';
import AiPlanSection from '@/features/meal-plan/components/optimized/AiPlanSection';
import { Suspense } from 'react';

export default function OptimizedMealPlanPage() {
  return (
    <div className='container mx-auto py-8'>
      <Card className='shadow-xl flex flex-col lg:grid grid-cols-2'>
        <SectionHeader
          className='text-3xl font-bold'
          title='AI-Optimized Weekly Meal Plan'
          description='Generate a personalized meal plan based on your profile, goals, and preferences.'
        />

        <Suspense fallback={<LoadingScreen />}>
          <AiPlanSection />
        </Suspense>
      </Card>
    </div>
  );
}
