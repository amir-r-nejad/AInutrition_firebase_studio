import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, Users } from 'lucide-react';
import {
  getAcceptedClientRequests,
  getPendingClientRequests,
} from '../../lib/data-service';

export async function CoachStatsCards() {
  const accpetedRequests = await getAcceptedClientRequests();
  const pendingRequests = await getPendingClientRequests();

  if (!accpetedRequests || !pendingRequests) return <p>No client</p>;

  const stats = [
    {
      title: 'Total Clients',
      value: accpetedRequests.length,
      icon: Users,
    },
    {
      title: 'Pending Requests',
      value: pendingRequests.length,
      icon: UserCheck,
      description: 'Awaiting client response',
    },
  ];

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      {stats.map((stat) => (
        <Card key={stat.title} className='border border-border/50'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              {stat.title}
            </CardTitle>
            <stat.icon className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-foreground'>
              {stat.value}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
