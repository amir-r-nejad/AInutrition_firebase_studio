import { Card } from '@/components/ui/card';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SectionHeader from '@/components/ui/SectionHeader';
import AiPlanSection from '@/features/meal-plan/components/optimized/AiPlanSection';
import { ChefHat } from 'lucide-react';
import { Suspense } from 'react';

async function CoachOptimizedMealPlanPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return (
    <div className='container mx-auto py-8'>
      <Card className='shadow-xl flex flex-col lg:grid grid-cols-2'>
        <SectionHeader
          className='text-3xl font-bold flex items-center'
          title='AI-Powered Weekly Meal Plan'
          description="Create a personalized meal plan tailored to your client's goals, preferences, and dietary needs."
          icon={<ChefHat className='mr-3 h-8 w-8 text-primary' />}
        />

        <Suspense
          fallback={<LoadingScreen loadingLabel='Generating AI meal plan...' />}
        >
          <AiPlanSection clientId={clientId} />
        </Suspense>
      </Card>
    </div>
  );
}

export default CoachOptimizedMealPlanPage;
