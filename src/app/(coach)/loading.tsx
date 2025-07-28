import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, Calendar, Award } from 'lucide-react';

function CoachLoading() {
  return (
    <div className='space-y-8 animate-pulse'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-56 bg-muted' />
          <Skeleton className='h-4 w-72 bg-muted' />
        </div>
        <div className='flex gap-3'>
          <Skeleton className='h-10 w-36 bg-muted' />
          <Skeleton className='h-10 w-32 bg-muted' />
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[Users, TrendingUp, Calendar, Award].map((Icon, i) => (
          <Card key={i} className='border-border/50'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between space-y-0 pb-2'>
                <Skeleton className='h-4 w-28 bg-muted' />
                <Icon className='h-4 w-4 text-muted-foreground/50' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-8 w-12 bg-muted' />
                <Skeleton className='h-3 w-24 bg-muted' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <Card className='border-border/50'>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-5 rounded bg-muted' />
                <Skeleton className='h-5 w-32 bg-muted' />
              </div>
              <div className='space-y-3'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className='flex items-center gap-3 p-3 border border-border/30 rounded-lg'
                  >
                    <Skeleton className='h-10 w-10 rounded-full bg-muted' />
                    <div className='flex-1 space-y-2'>
                      <Skeleton className='h-4 w-32 bg-muted' />
                      <Skeleton className='h-3 w-48 bg-muted' />
                    </div>
                    <Skeleton className='h-6 w-16 rounded-full bg-muted' />
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
              <div className='grid grid-cols-2 gap-3'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className='p-4 border border-border/30 rounded-lg space-y-2'
                  >
                    <Skeleton className='h-6 w-6 bg-muted mx-auto' />
                    <Skeleton className='h-4 w-20 bg-muted mx-auto' />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='border-border/50'>
        <CardContent className='p-6'>
          <div className='space-y-4'>
            <Skeleton className='h-5 w-32 bg-muted' />
            <div className='space-y-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className='flex items-center justify-between p-3 border border-border/30 rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-4 w-4 rounded bg-muted' />
                    <div className='space-y-1'>
                      <Skeleton className='h-4 w-40 bg-muted' />
                      <Skeleton className='h-3 w-24 bg-muted' />
                    </div>
                  </div>
                  <Skeleton className='h-6 w-16 rounded-full bg-muted' />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='flex items-center justify-center py-12'>
        <div className='flex flex-col items-center gap-4 text-center'>
          <div className='relative'>
            <Users className='h-12 w-12 text-primary animate-pulse' />
            <div className='absolute inset-0 rounded-full bg-primary/20 animate-ping' />
          </div>
          <div className='space-y-2'>
            <p className='text-xl font-semibold text-primary'>
              Loading coach dashboard...
            </p>
            <p className='text-sm text-muted-foreground max-w-md'>
              Preparing your client management tools and analytics
            </p>
            <div className='flex justify-center gap-1 pt-2'>
              <div className='w-2 h-2 bg-primary rounded-full animate-bounce' />
              <div
                className='w-2 h-2 bg-primary rounded-full animate-bounce'
                style={{ animationDelay: '0.1s' }}
              />
              <div
                className='w-2 h-2 bg-primary rounded-full animate-bounce'
                style={{ animationDelay: '0.2s' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoachLoading;
