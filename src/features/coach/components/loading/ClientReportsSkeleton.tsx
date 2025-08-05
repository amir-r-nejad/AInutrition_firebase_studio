import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ClientReportsSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Reports Header */}
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-56' />
          <Skeleton className='h-4 w-80' />
        </div>
        <div className='flex gap-3'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-28' />
        </div>
      </div>

      {/* Report Options */}
      <Card className='border-border/50'>
        <CardHeader>
          <Skeleton className='h-6 w-40' />
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className='p-4 border border-border/30 rounded-lg space-y-3'
              >
                <Skeleton className='h-8 w-8' />
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-9 w-full' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PDF Preview */}
      <Card className='border-border/50'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <Skeleton className='h-6 w-32' />
            <Skeleton className='h-10 w-24' />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-96 w-full rounded-lg' />
        </CardContent>
      </Card>
    </div>
  );
}
