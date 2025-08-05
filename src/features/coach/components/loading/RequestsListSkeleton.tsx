import { Skeleton } from '@/components/ui/skeleton';

export function RequestsListSkeleton() {
  return (
    <div className='space-y-4'>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className='flex items-center justify-between p-4 rounded-lg border border-border/30'
        >
          <div className='flex items-center gap-4'>
            <Skeleton className='h-12 w-12 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-48' />
              <div className='flex items-center gap-2'>
                <Skeleton className='h-3 w-3' />
                <Skeleton className='h-3 w-32' />
              </div>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-6 w-16 rounded-full' />
          </div>
        </div>
      ))}
    </div>
  );
}
