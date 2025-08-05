import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ClientProfileSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Profile Header */}
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-80' />
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card className='border-border/50'>
        <CardHeader>
          <div className='flex items-center gap-4'>
            <Skeleton className='h-20 w-20 rounded-full' />
            <div className='space-y-2 flex-1'>
              <Skeleton className='h-6 w-48' />
              <Skeleton className='h-4 w-64' />
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-16 rounded-full' />
                <Skeleton className='h-5 w-20 rounded-full' />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Details */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Personal Information */}
        <Card className='border-border/50'>
          <CardHeader>
            <Skeleton className='h-6 w-40' />
          </CardHeader>
          <CardContent className='space-y-4'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className='flex justify-between items-center'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-32' />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Health Metrics */}
        <Card className='border-border/50'>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
          </CardHeader>
          <CardContent className='space-y-4'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className='flex justify-between items-center'>
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-4 w-20' />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Goals and Preferences */}
      <Card className='border-border/50'>
        <CardHeader>
          <Skeleton className='h-6 w-48' />
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-20 w-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-40' />
            <div className='flex flex-wrap gap-2'>
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className='h-6 w-20 rounded-full' />
              ))}
            </div>
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-36' />
            <div className='flex flex-wrap gap-2'>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className='h-6 w-24 rounded-full' />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
