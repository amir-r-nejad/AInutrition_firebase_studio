import { Card, CardContent } from '@/components/ui/card';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SectionHeader from '@/components/ui/SectionHeader';
import { ProgressTrackingSection } from '@/features/body-progress/components/ProgressTrackingSection';
import { TrendingUp } from 'lucide-react';
import { Suspense } from 'react';

type CoachBodyProgressPageProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
  params: Promise<{ clientId: string }>;
};

export default async function CoachBodyProgressPage({
  searchParams,
  params,
}: CoachBodyProgressPageProps) {
  const { clientId } = await params;

  return (
    <div className='container mx-auto py-8'>
      <Card className='shadow-xl'>
        <SectionHeader
          icon={<TrendingUp className='h-8 w-8 text-primary' />}
          className='text-3xl font-bold'
          title='Client Progress Overview'
          description='Review and track your client’s body metrics over time to assess progress, identify trends, and make informed coaching decisions.'
        />

        <CardContent>
          <Suspense
            fallback={<LoadingScreen loadingLabel='loading you data...' />}
          >
            <ProgressTrackingSection
              searchParams={searchParams}
              clientId={clientId}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
