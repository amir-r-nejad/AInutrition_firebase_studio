import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function CoachProfileSkeleton() {
  return (
    <div className='space-y-8'>
      {/* Profile Header */}
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-72' />
        </div>
      </div>

      {/* Profile Form */}
      <Card className='border-border/50'>
        <CardHeader>
          <Skeleton className='h-6 w-40' />
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Avatar Section */}
          <div className='flex items-center gap-6'>
            <Skeleton className='h-20 w-20 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-9 w-28' />
            </div>
          </div>

          {/* Form Fields */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-10 w-full' />
              </div>
            ))}
          </div>

          {/* Bio Section */}
          <div className='space-y-2'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-24 w-full' />
          </div>

          {/* Action Buttons */}
          <div className='flex gap-4'>
            <Skeleton className='h-10 w-24' />
            <Skeleton className='h-10 w-20' />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
