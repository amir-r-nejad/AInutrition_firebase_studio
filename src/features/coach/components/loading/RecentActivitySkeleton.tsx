import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function RecentActivitySkeleton() {
  return (
    <Card className='border-border/50'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-4 w-16' />
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className='flex items-center gap-4 p-3 rounded-lg border border-border/30'
          >
            <Skeleton className='h-10 w-10 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-3 w-32' />
            </div>
            <Skeleton className='h-6 w-16 rounded-full' />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
