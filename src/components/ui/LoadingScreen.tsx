import { Card } from './card';
import Spinner from './Spinner';

function LoadingScreen({
  loadingLabel = 'Loading...',
}: {
  loadingLabel?: string;
}) {
  return (
    <Card className='flex justify-center items-center h-dvh w-full col-span-full'>
      <Spinner className='size-12 text-primary' />
      <p className='ml-4 text-lg'>{loadingLabel}</p>
    </Card>
  );
}

export default LoadingScreen;
