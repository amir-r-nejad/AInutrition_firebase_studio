import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useState } from 'react';
import { BodyProgressEntry } from '../types';
import EditProgressModal from './EditProgressModal';

function EditProgressButton({ entry }: { entry: BodyProgressEntry }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <Button onClick={() => setOpen(entry.id)} variant='outline' size='sm'>
        <Edit className='h-4 w-4 mr-1' />
        Edit
      </Button>

      <EditProgressModal
        progress={entry}
        isOpen={open === entry.id}
        onClose={() => setOpen(null)}
      />
    </>
  );
}

export default EditProgressButton;
