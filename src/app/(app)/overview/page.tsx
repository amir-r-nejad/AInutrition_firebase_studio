
import { Suspense } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ComprehensiveOverview from '@/features/overview/components/ComprehensiveOverview';

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50">
      <Suspense fallback={<LoadingScreen />}>
        <ComprehensiveOverview />
      </Suspense>
    </div>
  );
}
