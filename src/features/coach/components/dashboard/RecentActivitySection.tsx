import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarFallback } from '@radix-ui/react-avatar';
import { getRecentCoachClientRequests } from '../../lib/data-service';
import { getTimeAgo } from '@/lib/utils';
import { unstable_noStore as noStore } from 'next/cache';
import EmptyState from '@/components/ui/EmptyState';
import { Activity } from 'lucide-react';
import ErrorMessage from '@/components/ui/ErrorMessage';

export async function RecentActivitySection() {
  noStore();

  try {
    const recentRequests = await getRecentCoachClientRequests();
    if (!recentRequests)
      return (
        <EmptyState
          icon={Activity}
          title='No Recent Activity'
          description="You're all caught up! Once there's client activity, it'll pop up here."
        />
      );

    return (
      <Card className='border border-border/50'>
        <CardHeader>
          <CardTitle className='text-lg font-semibold'>
            Recent Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className='space-y-4'>
            {recentRequests.length <= 0 && <p>No requests found</p>}

            {recentRequests.length > 0 &&
              recentRequests.map((request) => {
                return (
                  <li
                    key={request.id}
                    className='flex items-center justify-between p-4 rounded-lg border border-border/30 hover:border-border/60 transition-colors duration-200'
                  >
                    <div className='flex items-center gap-4 w-full'>
                      <Avatar className='h-12 w-12 bg-primary/10 items-center justify-center'>
                        <AvatarImage src={'/placeholder.svg'} />
                        <AvatarFallback className='text-primary font-medium'>
                          {request.client_email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className='space-y-1 w-full'>
                        <div className='flex w-full justify-between'>
                          <p className='text-sm text-muted-foreground'>
                            {request.client_email}
                          </p>
                          <Badge
                            className='capitalize'
                            variant={
                              request.status === 'accepted'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <p className='text-xs text-muted-foreground capitalize'>
                          {getTimeAgo({ startDate: request.requested_at })}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        </CardContent>
      </Card>
    );
  } catch (error) {
    return (
      <ErrorMessage
        title='Something Went Wrong'
        message={
          error instanceof Error
            ? error.message
            : "We couldn't load the data. Please try again later or refresh the page."
        }
      />
    );
  }
}
