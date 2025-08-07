import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function CoachStatsCardsSkeleton() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className='border-border/50'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-8 w-16' />
              </div>
              <Skeleton className='h-8 w-8 rounded-md' />
            </div>
            <div className='mt-4'>
              <Skeleton className='h-3 w-24' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
