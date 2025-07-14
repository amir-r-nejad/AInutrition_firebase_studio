import Spinner from './Spinner';

function LoadingScreen({
  loadingLabel = 'Loading...',
}: {
  loadingLabel?: string;
}) {
  return (
    <div className='flex justify-center items-center h-dvh'>
      <Spinner className='size-12 text-primary' />
      <p className='ml-4 text-lg'>{loadingLabel}</p>
    </div>
  );
}

export default LoadingScreen;
