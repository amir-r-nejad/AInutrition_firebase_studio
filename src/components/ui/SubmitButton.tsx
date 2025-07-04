'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

type ButtonProps = {
  icon?: ReactNode;
  isLoading: boolean;
  loadingLabel: string;
  label: string;
  className?: string;
};

function SubmitButton({
  icon,
  isLoading,
  loadingLabel,
  label,
  className,
}: ButtonProps) {
  return (
    <Button
      type='submit'
      className={cn('w-full', className)}
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : icon}
      {isLoading ? loadingLabel : label}
    </Button>
  );
}

export default SubmitButton;
