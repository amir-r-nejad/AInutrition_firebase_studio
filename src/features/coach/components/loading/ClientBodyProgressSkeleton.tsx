import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ClientBodyProgressSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Progress Header */}
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-72' />
          <Skeleton className='h-4 w-96' />
        </div>
        <Skeleton className='h-10 w-36' />
      </div>

      {/* Month Selector */}
      <div className='flex items-center justify-center gap-4'>
        <Skeleton className='h-10 w-10' />
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-10 w-10' />
      </div>

      {/* Progress Chart */}
      <Card className='border-border/50'>
        <CardHeader>
          <Skeleton className='h-6 w-40' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-80 w-full' />
        </CardContent>
      </Card>

      {/* Progress Entries */}
      <Card className='border-border/50'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-10 w-32' />
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className='flex items-center justify-between p-4 border border-border/30 rounded-lg'
            >
              <div className='space-y-2'>
                <Skeleton className='h-5 w-24' />
                <div className='flex items-center gap-4'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-4 w-16' />
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-8 w-8' />
                <Skeleton className='h-8 w-8' />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
