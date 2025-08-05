import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ClientMealPlanSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Meal Plan Header */}
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-4 w-80' />
        </div>
        <div className='flex gap-3'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-28' />
        </div>
      </div>

      {/* Week Navigation */}
      <div className='flex items-center justify-between'>
        <Skeleton className='h-10 w-10' />
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-10 w-10' />
      </div>

      {/* Days Tabs */}
      <div className='flex gap-2 overflow-x-auto'>
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className='h-10 w-24 flex-shrink-0' />
        ))}
      </div>

      {/* Meals Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className='border-border/50'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-5 w-20' />
                <Skeleton className='h-8 w-8' />
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Skeleton className='h-32 w-full rounded-md' />
              <div className='space-y-2'>
                <Skeleton className='h-5 w-full' />
                <Skeleton className='h-4 w-3/4' />
              </div>
              <div className='grid grid-cols-3 gap-2'>
                <div className='text-center space-y-1'>
                  <Skeleton className='h-3 w-8 mx-auto' />
                  <Skeleton className='h-6 w-12 mx-auto' />
                </div>
                <div className='text-center space-y-1'>
                  <Skeleton className='h-3 w-8 mx-auto' />
                  <Skeleton className='h-6 w-12 mx-auto' />
                </div>
                <div className='text-center space-y-1'>
                  <Skeleton className='h-3 w-8 mx-auto' />
                  <Skeleton className='h-6 w-12 mx-auto' />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
