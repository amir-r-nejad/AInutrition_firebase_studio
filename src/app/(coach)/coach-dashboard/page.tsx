import { Card, CardContent } from '@/components/ui/card';
import SectionHeader from '@/components/ui/SectionHeader';
import { CoachDashboardHeader } from '@/features/coach/components/dashboard/CoachDashboardHeader';
import { CoachStatsCards } from '@/features/coach/components/dashboard/CoachStatsCards';
import { QuickActionsSection } from '@/features/coach/components/dashboard/QuickActionsSection';
import { RecentActivitySection } from '@/features/coach/components/dashboard/RecentActivitySection';
import { CoachDashboardSkeleton } from '@/features/coach/components/loading/CoachDashboardSkeleton';
import { Suspense } from 'react';

export default function CoachDashboardPage() {
  return (
    <div className='space-y-8'>
      <Card>
        <SectionHeader
          className='text-3xl font-bold'
          title='Coach Dashboard'
          description='Manage your clients and track their progress'
        />
        <CardContent>
          <Suspense fallback={<CoachDashboardSkeleton />}>
            <div className='space-y-8'>
              <CoachDashboardHeader />
              <CoachStatsCards />
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                <RecentActivitySection />
                <QuickActionsSection />
              </div>
            </div>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
