'use client';

import { Button } from '@/components/ui/button';
import SearchForm from '@/components/ui/SearchForm';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { SendRequestModal } from './SendRequestModal';

export function RequestsHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-foreground'>
            Find New Clients
          </h1>
          <p className='text-muted-foreground'>
            Browse potential clients and send coaching requests
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <SearchForm
            searchQuery='clients'
            placeholder='Search clients...'
            inputClassName='w-64'
          />

          <Button onClick={() => setIsModalOpen(true)} className='gap-2'>
            <UserPlus className='size-4' />
            Send Request
          </Button>
        </div>
      </div>

      <SendRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
