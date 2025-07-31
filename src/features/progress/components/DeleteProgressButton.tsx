'use client';

import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { deleteUserProgress } from '../lib/progress-service';
import { BodyProgressEntry } from '../types';
import Spinner from '@/components/ui/Spinner';

function DeleteProgressButton({ entry }: { entry: BodyProgressEntry }) {
  const [isDeleting, startDeleting] = useTransition();

  async function handleDelete(entry: BodyProgressEntry) {
    startDeleting(async () => {
      try {
        await deleteUserProgress(entry);
        toast({
          title: 'Entry Deleted',
          description: 'Your progress entry has been successfully removed.',
        });
      } catch (error) {
        toast({
          title: 'Delete Failed',
          description:
            error instanceof Error
              ? error.message
              : 'Something went wrong while deleting the entry.',
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <Button
      onClick={async () => await handleDelete(entry)}
      disabled={isDeleting}
      variant='outline'
      size='sm'
      className='hover:border-destructive hover:text-destructive hover:bg-destructive/5'
    >
      {isDeleting ? <Spinner /> : <Trash2 className='h-4 w-4' />}
    </Button>
  );
}

export default DeleteProgressButton;
