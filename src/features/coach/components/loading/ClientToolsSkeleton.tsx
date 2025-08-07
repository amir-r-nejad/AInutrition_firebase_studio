import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ClientToolsSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Tools Header */}
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-4 w-96' />
        </div>
      </div>

      {/* Current Values Summary */}
      <Card className='border-border/50'>
        <CardHeader>
          <Skeleton className='h-6 w-48' />
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className='text-center space-y-2'>
                <Skeleton className='h-4 w-16 mx-auto' />
                <Skeleton className='h-8 w-20 mx-auto' />
                <Skeleton className='h-3 w-12 mx-auto' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tool Form */}
      <Card className='border-border/50'>
        <CardHeader>
          <Skeleton className='h-6 w-40' />
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-10 w-full' />
              </div>
            ))}
          </div>
          <Skeleton className='h-10 w-32' />
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className='border-border/50'>
        <CardHeader>
          <Skeleton className='h-6 w-36' />
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 border border-border/30 rounded-lg'
              >
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-16' />
                <Skeleton className='h-4 w-12' />
                <Skeleton className='h-8 w-16' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
