import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import SectionHeader from '@/components/ui/SectionHeader';
import { Users } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import { getCoachClients } from '../../lib/data-service';
import ClientsList from './ClientsList';

export async function AcceptedClientsSection({}) {
  noStore();
  const clients = await getCoachClients();

  if (!clients || clients.length === 0)
    return (
      <EmptyState
        icon={Users}
        title='No Clients Yet'
        description="You haven't accepted any clients yet. Check your pending requests or share your coaching profile to get started."
      />
    );

  return (
    <Card className='border border-border/50'>
      <SectionHeader
        icon={<Users />}
        title='Accepted Clients'
        className='text-lg font-semibold'
        headerClassName='grid grid-cols-2'
      >
        <Badge variant='default' className='text-xs place-self-end'>
          {clients.length} client{clients.length > 1 ? 's' : ''}
        </Badge>
      </SectionHeader>
      <CardContent>
        <ClientsList clients={clients} />
      </CardContent>
    </Card>
  );
}
