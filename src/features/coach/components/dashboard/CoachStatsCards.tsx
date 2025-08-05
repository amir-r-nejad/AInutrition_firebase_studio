import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import { Clock, Users } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import {
  getAcceptedClientRequests,
  getPendingClientRequests,
} from '../../lib/data-service';

export async function CoachStatsCards() {
  noStore();

  const acceptedRequests = await getAcceptedClientRequests();
  const pendingRequests = await getPendingClientRequests();

  if (!acceptedRequests || !pendingRequests)
    return (
      <EmptyState
        icon={Users}
        title='No Requests Found'
        description="Looks like there are no client requests available right now. Once someone sends a request, it'll show up here."
      />
    );

  const stats = [
    {
      title: 'Active Clients',
      value: acceptedRequests.length,
      icon: Users,
      description: 'Currently coaching',
      borderColor: 'border-accent/50 group-hover:border-accent/80',
      bgColor: 'bg-accent/15',
      iconColor: 'text-accent',
    },
    {
      title: 'Pending Requests',
      value: pendingRequests.length,
      icon: Clock,
      description: 'Awaiting your response',
      borderColor: 'border-primary/50 group-hover:border-primary/80',
      bgColor: 'bg-secondary/15',
      iconColor: 'text-secondary',
    },
  ];

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className='group border border-border/50 transition-all duration-200 group'
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              {stat.title}
            </CardTitle>
            <div
              className={`p-2 rounded-lg border ${stat.bgColor} ${stat.borderColor} transition-transform duration-200`}
            >
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex items-baseline gap-2'>
              <div className={`${stat.iconColor} text-3xl font-bold`}>
                {stat.value}
              </div>
            </div>
            <p className='text-sm text-muted-foreground'>{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
