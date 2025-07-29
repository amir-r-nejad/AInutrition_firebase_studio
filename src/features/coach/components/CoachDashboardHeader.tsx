import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, Clock, TrendingUp } from 'lucide-react';

const statsData = [
  {
    title: 'Total Clients',
    value: '24',
    icon: UserCheck,
    change: '+3 this month',
    changeType: 'positive' as const,
  },
  {
    title: 'Pending Requests',
    value: '8',
    icon: Clock,
    change: '2 new today',
    changeType: 'neutral' as const,
  },
  {
    title: 'Active Plans',
    value: '18',
    icon: TrendingUp,
    change: '+5 this week',
    changeType: 'positive' as const,
  },
  {
    title: 'Available Slots',
    value: '6',
    icon: Users,
    change: 'Out of 30',
    changeType: 'neutral' as const,
  },
];

export function CoachDashboardHeader() {
  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold text-foreground'>Coach Dashboard</h1>
        <p className='text-muted-foreground'>
          Manage your clients and track their nutrition progress
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {statsData.map((stat) => (
          <Card
            key={stat.title}
            className='border border-border/50 hover:border-border transition-colors duration-200'
          >
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    {stat.title}
                  </p>
                  <p className='text-2xl font-bold text-foreground'>
                    {stat.value}
                  </p>
                </div>
                <div className='h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center'>
                  <stat.icon className='h-6 w-6 text-primary' />
                </div>
              </div>
              <div className='mt-4'>
                <Badge
                  variant={
                    stat.changeType === 'positive' ? 'default' : 'secondary'
                  }
                  className='text-xs'
                >
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
