import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';

export function ClientsHeader() {
  return (
    <div className='flex items-center justify-between'>
      <div>
        <h1 className='text-2xl font-bold text-foreground'>My Clients</h1>
        <p className='text-muted-foreground'>
          Manage your accepted clients and track their progress
        </p>
      </div>

      <div className='flex items-center gap-3'>
        <Link href='/coach-dashboard/requests'>
          <Button className='gap-2'>
            <UserPlus className='h-4 w-4' />
            Find New Clients
          </Button>
        </Link>
      </div>
    </div>
  );
}
