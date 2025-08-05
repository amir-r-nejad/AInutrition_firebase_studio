import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function ClientsListSkeleton() {
  return (
    <div className='space-y-4'>
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className='border border-border/50'>
          <CardContent className='p-6'>
            <div className='flex flex-col lg:flex-row gap-6 lg:items-center justify-between'>
              <div className='flex items-start gap-4 flex-1'>
                <Skeleton className='h-14 w-14 rounded-full' />
                <div className='space-y-3 flex-1'>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-3 flex-wrap'>
                      <Skeleton className='h-6 w-32' />
                      <div className='flex items-center gap-2'>
                        <Skeleton className='h-5 w-12 rounded-full' />
                        <Skeleton className='h-5 w-16 rounded-full' />
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Skeleton className='h-4 w-4' />
                      <Skeleton className='h-4 w-48' />
                    </div>
                  </div>
                  <div className='flex items-center gap-4 flex-wrap'>
                    <Skeleton className='h-5 w-20 rounded-full' />
                    <div className='flex items-center gap-2'>
                      <Skeleton className='h-3 w-3' />
                      <Skeleton className='h-3 w-24' />
                    </div>
                  </div>
                </div>
              </div>
              <Skeleton className='h-10 w-32' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
