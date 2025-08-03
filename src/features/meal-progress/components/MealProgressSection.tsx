import LoadingScreen from '@/components/ui/LoadingScreen';
import { TabsContent } from '@/components/ui/tabs';
import { Suspense } from 'react';
import { getUserMealProgress } from '../lib/meal-progress-service';
import DailyTrackProgressTab from './DailyTrackProgressTab';
import { OverallProgressTab } from './OverallProgressTab';

type MealProgressSectionProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
  clientId?: string;
};

export async function MealProgressSection({
  searchParams,
  clientId,
}: MealProgressSectionProps) {
  const progressPlan = await getUserMealProgress(clientId);

  return (
    <>
      <TabsContent value='daily-tracking' className='mt-6 space-y-6'>
        <Suspense key='meal-plan-suspense' fallback={<LoadingScreen />}>
          <DailyTrackProgressTab
            progressPlan={progressPlan}
            searchParams={searchParams}
            clientId={clientId}
          />
        </Suspense>
      </TabsContent>

      <TabsContent value='overall-progress' className='mt-6'>
        <OverallProgressTab progressPlan={progressPlan} />
      </TabsContent>
    </>
  );
}
