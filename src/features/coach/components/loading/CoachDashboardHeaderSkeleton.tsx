import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function CoachDashboardHeaderSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Header Section */}
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
        <div className='space-y-3'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-4 w-96' />
        </div>
        <div className='flex gap-3'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-28' />
        </div>
      </div>

      {/* Welcome Card */}
      <Card className='border-border/50'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-4'>
            <Skeleton className='h-12 w-12 rounded-full' />
            <div className='space-y-2 flex-1'>
              <Skeleton className='h-6 w-48' />
              <Skeleton className='h-4 w-72' />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
