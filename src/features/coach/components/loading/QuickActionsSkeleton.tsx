import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function QuickActionsSkeleton() {
  return (
    <Card className='border-border/50'>
      <CardHeader>
        <Skeleton className='h-6 w-32' />
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className='flex items-center gap-4 p-4 rounded-lg border border-border/30 hover:border-border/60 transition-colors'
            >
              <Skeleton className='h-10 w-10 rounded-md' />
              <div className='space-y-2 flex-1'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-3 w-36' />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
