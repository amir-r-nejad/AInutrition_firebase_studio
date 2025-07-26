import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCoachClients } from '../../lib/data-service';
import ClientsList from './ClientsList';

export async function AcceptedClientsSection() {
  const clients = await getCoachClients();
  if (!clients) return <p>You do not have any clinets</p>;

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
