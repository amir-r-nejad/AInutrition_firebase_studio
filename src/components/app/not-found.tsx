import { SearchX } from 'lucide-react';

function RootNotFound() {
  return (
    <div className='flex flex-col items-center justify-center gap-4 w-full h-dvh'>
      <SearchX className='size-24 text-zinc-700' />
      <div className='flex flex-col text-center gap-1'>
        <h2 className='text-2xl md:text-3xl font-bold text-zinc-700'>
          No result found
        </h2>
        <p className='text-sm md:text-base text-muted-foreground'>
          We can&apos;t find any product matching your search
        </p>
      </div>
    </div>
  );
}

export default RootNotFound;
