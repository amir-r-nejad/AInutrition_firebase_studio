import { Card, CardContent } from '@/components/ui/card';
import SectionHeader from '@/components/ui/SectionHeader';
import { Tabs } from '@/components/ui/tabs';
import { MealProgressSection } from '@/features/meal-progress/components/MealProgressSection';
import MealProgressTabs from '@/features/meal-progress/components/MealProgressTabs';
import { ClientMealProgressSkeleton } from '@/features/coach/components/loading/ClientMealProgressSkeleton';
import { Activity } from 'lucide-react';
import { Suspense } from 'react';

type MealProgressPageProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
  params: Promise<{ clientId: string }>;
};

async function CoachMealProgressPage({
  searchParams,
  params,
}: MealProgressPageProps) {
  const { clientId } = await params;

  return (
    <div className='container mx-auto py-8'>
      <Card className='shadow-xl'>
        <SectionHeader
          icon={<Activity className='h-8 w-8 text-primary' />}
          className='text-3xl font-bold'
          title='Client Meal Progress Tracking'
          description="Review your clients' meal tracking data and compare it against their personalized nutrition plans. Monitor adherence and make informed adjustments as needed."
        />

        <CardContent className='space-y-6'>
          <Tabs defaultValue='daily-tracking' className='w-full'>
            <MealProgressTabs />

            <Suspense fallback={<ClientMealProgressSkeleton />}>
              <MealProgressSection
                searchParams={searchParams}
                clientId={clientId}
              />
            </Suspense>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default CoachMealProgressPage;
