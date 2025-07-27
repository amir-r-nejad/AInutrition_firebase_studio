import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarFallback } from '@radix-ui/react-avatar';
import { getRecentCoachClientRequests } from '../../lib/data-service';
import { getTimeAgo } from '@/lib/utils';

export async function RecentActivitySection() {
  const recentRequests = await getRecentCoachClientRequests();
  if (!recentRequests) return <p>No requests</p>;

  return (
    <Card className='border border-border/50'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>Recent Requests</CardTitle>
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
}
