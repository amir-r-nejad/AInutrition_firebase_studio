import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ClientMealProgressSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Progress Header */}
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-80' />
          <Skeleton className='h-4 w-full max-w-2xl' />
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-2'>
        <Skeleton className='h-10 w-32' />
        <Skeleton className='h-10 w-36' />
      </div>

      {/* Date Picker */}
      <div className='flex items-center gap-4'>
        <Skeleton className='h-4 w-16' />
        <Skeleton className='h-10 w-48' />
      </div>

      {/* Progress Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className='border-border/50'>
            <CardContent className='p-4 text-center'>
              <Skeleton className='h-4 w-16 mx-auto mb-2' />
              <Skeleton className='h-8 w-12 mx-auto mb-1' />
              <Skeleton className='h-3 w-20 mx-auto' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Meals Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className='border-border/50'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-5 w-20' />
                <Skeleton className='h-6 w-16 rounded-full' />
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Skeleton className='h-5 w-full' />
                <Skeleton className='h-4 w-3/4' />
              </div>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-4 w-12' />
                </div>
                <Skeleton className='h-2 w-full' />
              </div>
              <div className='grid grid-cols-3 gap-2 text-center'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className='space-y-1'>
                    <Skeleton className='h-3 w-8 mx-auto' />
                    <Skeleton className='h-4 w-10 mx-auto' />
                  </div>
                ))}
              </div>
              <Skeleton className='h-9 w-full' />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
