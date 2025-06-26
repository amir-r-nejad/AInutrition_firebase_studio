import Spinner from '@/components/ui/Spinner';

function DashboardLoading() {
  return (
    <div className='flex items-center justify-center h-dvh w-full'>
      <Spinner />
      <span className='ml-2 text-lg text-muted-foreground'>Loading...</span>
    </div>
  );
}

export default DashboardLoading;
