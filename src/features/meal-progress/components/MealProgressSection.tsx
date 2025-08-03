import { CardContent } from '@/components/ui/card';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Suspense } from 'react';
import { getUserMealProgress } from '../lib/meal-progress-service';
import DailyTrackProgressTab from './DailyTrackProgressTab';
import MealProgressTabs from './MealProgressTabs';
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
    <CardContent className='space-y-6'>
      <Tabs defaultValue='daily-tracking' className='w-full'>
        <MealProgressTabs />

        <TabsContent value='daily-tracking' className='mt-6 space-y-6'>
          <Suspense fallback={<LoadingScreen />}>
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
      </Tabs>
    </CardContent>
  );
}
