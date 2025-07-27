import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Leaf } from 'lucide-react';

function AuthLoading() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-background p-4'>
      <div className='w-full max-w-md space-y-6'>
        <div className='flex flex-col items-center space-y-4'>
          <div className='flex items-center gap-2'>
            <Leaf className='h-8 w-8 text-primary animate-pulse' />
            <span className='text-2xl font-bold text-primary'>NutriPlan</span>
          </div>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <div className='h-2 w-2 bg-primary rounded-full animate-bounce' />
            <div
              className='h-2 w-2 bg-primary rounded-full animate-bounce'
              style={{ animationDelay: '0.1s' }}
            />
            <div
              className='h-2 w-2 bg-primary rounded-full animate-bounce'
              style={{ animationDelay: '0.2s' }}
            />
          </div>
        </div>

        <Card className='border-border/50 shadow-lg'>
          <CardHeader className='space-y-2'>
            <Skeleton className='h-6 w-32 bg-muted mx-auto' />
            <Skeleton className='h-4 w-48 bg-muted mx-auto' />
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-3'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-16 bg-muted' />
                <Skeleton className='h-10 w-full bg-muted rounded-md' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20 bg-muted' />
                <Skeleton className='h-10 w-full bg-muted rounded-md' />
              </div>
            </div>

            <Skeleton className='h-10 w-full bg-primary/20 rounded-md' />

            <div className='flex items-center gap-4'>
              <Skeleton className='h-px flex-1 bg-muted' />
              <Skeleton className='h-4 w-8 bg-muted' />
              <Skeleton className='h-px flex-1 bg-muted' />
            </div>

            <Skeleton className='h-10 w-full bg-muted rounded-md' />

            <div className='text-center'>
              <Skeleton className='h-4 w-40 bg-muted mx-auto' />
            </div>
          </CardContent>
        </Card>

        <div className='text-center'>
          <p className='text-sm text-muted-foreground'>
            Loading authentication...
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthLoading;
