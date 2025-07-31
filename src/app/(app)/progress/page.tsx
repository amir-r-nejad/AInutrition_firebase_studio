import { Card, CardContent } from '@/components/ui/card';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SectionHeader from '@/components/ui/SectionHeader';
import { ProgressTrackingSection } from '@/features/progress/components/ProgressTrackingSection';
import { TrendingUp } from 'lucide-react';
import { Suspense } from 'react';

export default function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  return (
    <div className='container mx-auto py-8'>
      <Card className='shadow-xl'>
        <SectionHeader
          icon={<TrendingUp className='h-8 w-8 text-primary' />}
          className='text-3xl font-bold'
          title='Progress Tracking'
          description='Track your weekly body measurements and visualize your fitness journey over time.'
        />
        <CardContent>
          <Suspense
            fallback={<LoadingScreen loadingLabel='loading you data...' />}
          >
            <ProgressTrackingSection searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
