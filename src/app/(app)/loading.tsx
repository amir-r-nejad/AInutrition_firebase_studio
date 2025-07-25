import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Leaf } from 'lucide-react';

function AppLoading() {
  return (
    <div className='space-y-8 animate-pulse'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-48 bg-muted' />
          <Skeleton className='h-4 w-64 bg-muted' />
        </div>
        <div className='flex gap-3'>
          <Skeleton className='h-10 w-32 bg-muted' />
          <Skeleton className='h-10 w-40 bg-muted' />
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className='border-border/50'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between space-y-0 pb-2'>
                <Skeleton className='h-4 w-24 bg-muted' />
                <div className='h-4 w-4 rounded bg-muted' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-8 w-16 bg-muted' />
                <Skeleton className='h-3 w-20 bg-muted' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <Card className='border-border/50'>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-5 rounded bg-muted' />
                <Skeleton className='h-5 w-32 bg-muted' />
              </div>
              <div className='space-y-3'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className='space-y-2'>
                    <div className='flex justify-between'>
                      <Skeleton className='h-4 w-16 bg-muted' />
                      <Skeleton className='h-4 w-20 bg-muted' />
                    </div>
                    <Skeleton className='h-2 w-full bg-muted rounded-full' />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/50'>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <Skeleton className='h-5 w-28 bg-muted' />
              <div className='space-y-3'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className='flex items-center justify-between'>
                    <Skeleton className='h-4 w-20 bg-muted' />
                    <Skeleton className='h-6 w-12 rounded-full bg-muted' />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='flex items-center justify-center py-8'>
        <div className='flex items-center gap-3 text-primary'>
          <Leaf className='h-8 w-8 animate-spin' />
          <div className='space-y-1'>
            <p className='text-lg font-medium'>
              Loading your nutrition data...
            </p>
            <p className='text-sm text-muted-foreground'>
              Please wait while we prepare your dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppLoading;
