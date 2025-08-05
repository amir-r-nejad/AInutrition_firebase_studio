import { Skeleton } from '@/components/ui/skeleton';

export function ClientsHeaderSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-72' />
        </div>
        <Skeleton className='h-10 w-32' />
      </div>
    </div>
  );
}
