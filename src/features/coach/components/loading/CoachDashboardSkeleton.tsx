import { CoachDashboardHeaderSkeleton } from './CoachDashboardHeaderSkeleton';
import { CoachStatsCardsSkeleton } from './CoachStatsCardsSkeleton';
import { RecentActivitySkeleton } from './RecentActivitySkeleton';
import { QuickActionsSkeleton } from './QuickActionsSkeleton';

export function CoachDashboardSkeleton() {
  return (
    <div className='space-y-8 p-6'>
      <CoachDashboardHeaderSkeleton />
      <CoachStatsCardsSkeleton />
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <RecentActivitySkeleton />
        <QuickActionsSkeleton />
      </div>
    </div>
  );
}
