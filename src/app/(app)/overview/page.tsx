import { Suspense } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ComprehensiveOverview from '@/features/overview/components/ComprehensiveOverview';

export default function OverviewPage() {
  return (
    <div className='min-h-dvh'>
      <Suspense fallback={<LoadingScreen />}>
        <ComprehensiveOverview />
      </Suspense>
    </div>
  );
}
