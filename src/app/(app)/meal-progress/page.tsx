import { Card, CardContent } from '@/components/ui/card';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SectionHeader from '@/components/ui/SectionHeader';
import { Tabs } from '@/components/ui/tabs';
import { MealProgressSection } from '@/features/meal-progress/components/MealProgressSection';
import MealProgressTabs from '@/features/meal-progress/components/MealProgressTabs';
import { Activity } from 'lucide-react';
import { Suspense } from 'react';

type MealProgressPageProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function MealProgressPage({
  searchParams,
}: MealProgressPageProps) {
  return (
    <div className='container mx-auto py-8'>
      <Card className='shadow-xl'>
        <SectionHeader
          icon={<Activity className='h-8 w-8 text-primary' />}
          className='text-3xl font-bold'
          title='Meal Progress Tracking'
          description="Track your daily meals and compare them to your nutrition plan. See how well you're following your personalized meal schedule."
        />

        <CardContent className='space-y-6'>
          <Tabs defaultValue='daily-tracking' className='w-full'>
            <MealProgressTabs />

            <Suspense
              key='meal-progress-suspense'
              fallback={
                <LoadingScreen loadingLabel='Loading meal progress...' />
              }
            >
              <MealProgressSection searchParams={searchParams} />
            </Suspense>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
