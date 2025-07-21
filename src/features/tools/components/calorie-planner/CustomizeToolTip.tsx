'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

function CustomizeToolTip({ message }: { message: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-5 w-5 ml-1 p-0'
          >
            <Info className='h-3 w-3' />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent className='w-64'>
        <p>{message}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default CustomizeToolTip;
