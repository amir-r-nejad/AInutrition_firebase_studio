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
  size?: 'icon' | 'default' | 'sm' | 'lg';
};

function SubmitButton({
  icon,
  isLoading,
  loadingLabel,
  label,
  className,
  size,
}: ButtonProps) {
  return (
    <Button
      type='submit'
      className={cn('w-full', className)}
      disabled={isLoading}
      size={size || 'default'}
    >
      {isLoading ? <Loader2 className='size-3 animate-spin' /> : icon}
      {isLoading ? loadingLabel : label}
    </Button>
  );
}

export default SubmitButton;
