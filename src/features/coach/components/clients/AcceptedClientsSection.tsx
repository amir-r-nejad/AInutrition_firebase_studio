import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCoachClients } from '../../lib/data-service';
import ClientsList from './ClientsList';
import EmptyState from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';

export async function AcceptedClientsSection() {
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
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-semibold'>
            Accepted Clients
          </CardTitle>
          <Badge variant='default' className='text-xs'>
            {clients.length} client{clients.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ClientsList clients={clients} />
      </CardContent>
    </Card>
  );
}
