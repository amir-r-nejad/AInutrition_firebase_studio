import { Skeleton } from '@/components/ui/skeleton';

export function RequestsHeaderSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-56' />
          <Skeleton className='h-4 w-80' />
        </div>
        <Skeleton className='h-10 w-36' />
      </div>

      {/* Search and filter section */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <Skeleton className='h-10 flex-1' />
        <Skeleton className='h-10 w-32' />
      </div>
    </div>
  );
}
