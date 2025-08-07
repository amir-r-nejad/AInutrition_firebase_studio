import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ClientDashboardSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Client Header */}
      <Card className='border-border/50'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-4'>
            <Skeleton className='h-16 w-16 rounded-full' />
            <div className='space-y-2 flex-1'>
              <Skeleton className='h-6 w-48' />
              <Skeleton className='h-4 w-64' />
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-16 rounded-full' />
                <Skeleton className='h-5 w-20 rounded-full' />
              </div>
            </div>
            <Skeleton className='h-10 w-32' />
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className='border-border/50'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-8 w-16' />
                </div>
                <Skeleton className='h-8 w-8 rounded-md' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className='border-border/50'>
        <CardHeader>
          <Skeleton className='h-6 w-32' />
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className='p-4 border border-border/30 rounded-lg text-center space-y-2'
              >
                <Skeleton className='h-8 w-8 mx-auto' />
                <Skeleton className='h-4 w-20 mx-auto' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className='border-border/50'>
        <CardHeader>
          <Skeleton className='h-6 w-40' />
        </CardHeader>
        <CardContent className='space-y-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className='flex items-center gap-3 p-3 border border-border/30 rounded-lg'
            >
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-4 w-48' />
                <Skeleton className='h-3 w-32' />
              </div>
              <Skeleton className='h-3 w-16' />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
