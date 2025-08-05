import { Card, CardContent } from '@/components/ui/card';
import SectionHeader from '@/components/ui/SectionHeader';
import { cn } from '@/lib/utils';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { primaryActions } from '../../lib/constant';

export function QuickActionsSection() {
  return (
    <Card className='border border-border/50'>
      <SectionHeader
        className='text-xl font-semibold'
        description='Common tasks and shortcuts to help you manage your coaching practice'
        title='Quick Actions'
        icon={<UserPlus className='h-5 w-5 text-primary' />}
      />

      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {primaryActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card
                className={cn(
                  'border-2 border-border/30 transition-all duration-200 cursor-pointer group',
                  action.color
                )}
              >
                <CardContent className='p-6'>
                  <div className='flex items-start gap-4'>
                    <div className={cn('p-3 rounded-xl', action.bgColor)}>
                      <action.icon
                        className={cn('h-6 w-6', action.iconColor)}
                      />
                    </div>
                    <div className='flex-1 space-y-1'>
                      <h3 className='font-semibold transition-colors'>
                        {action.title}
                      </h3>
                      <p className='text-sm text-muted-foreground'>
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
