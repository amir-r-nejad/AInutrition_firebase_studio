import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { UserPlus, Users } from 'lucide-react';
import Link from 'next/link';

export function QuickActionsSection() {
  const actions = [
    {
      title: 'Find New Clients',
      description: 'Browse potential clients and send requests',
      icon: UserPlus,
      href: '/coach-dashboard/requests',
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    },
    {
      title: 'View My Clients',
      description: 'Manage your accepted clients',
      icon: Users,
      href: '/coach-dashboard/clients',
      color: 'bg-green-50 text-green-600 hover:bg-green-100',
    },
  ];

  return (
    <Card className='border border-border/50'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-3'>
          {actions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Button
                variant='ghost'
                className='h-auto p-4 flex flex-col items-start gap-2 transition-colors duration-200 w-full'
              >
                <div
                  className={cn(
                    'p-2 rounded-lg transition-colors duration-200',
                    action.color
                  )}
                >
                  <action.icon className='h-4 w-4' />
                </div>
                <div className='text-left'>
                  <p className='font-medium text-sm'>{action.title}</p>
                  <p className='text-xs text-muted-foreground'>
                    {action.description}
                  </p>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
