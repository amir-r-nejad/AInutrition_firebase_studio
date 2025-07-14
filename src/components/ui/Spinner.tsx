import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn('size-7 animate-spin transition-all', className)} />
  );
}

export default Spinner;
