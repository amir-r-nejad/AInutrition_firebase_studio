import PageLoadingSpinner from '@/components/ui/PageLoadingSpinner';
import { CoachDashboardHeader } from '@/features/coach/components/dashboard/CoachDashboardHeader';
import { CoachStatsCards } from '@/features/coach/components/dashboard/CoachStatsCards';
import { QuickActionsSection } from '@/features/coach/components/dashboard/QuickActionsSection';
import { RecentActivitySection } from '@/features/coach/components/dashboard/RecentActivitySection';
import { Suspense } from 'react';

export default function CoachDashboardPage() {
  return (
    <div className='space-y-8'>
      <Suspense
        fallback={<PageLoadingSpinner message='Loading dashboard header...' />}
      >
        <CoachDashboardHeader />
      </Suspense>

      <Suspense
        fallback={<PageLoadingSpinner message='Loading your stats...' />}
      >
        <CoachStatsCards />
      </Suspense>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <Suspense
          fallback={<PageLoadingSpinner message='Loading recent activity...' />}
        >
          <RecentActivitySection />
        </Suspense>

        <QuickActionsSection />
      </div>
    </div>
  );
}
