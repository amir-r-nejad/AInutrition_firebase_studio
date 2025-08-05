import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getTimeAgo } from '@/lib/utils';
import { AvatarFallback } from '@radix-ui/react-avatar';
import { Clock, User } from 'lucide-react';

type RecentRequestsListProps = {
  recentRequests: {
    status: any;
    requested_at: any;
    client_email: any;
    id: any;
  }[];
};

function RecentRequestsList({ recentRequests }: RecentRequestsListProps) {
  return (
    <div className='space-y-4'>
      {recentRequests.map((request) => (
        <div
          key={request.id}
          className='flex items-center justify-between p-4 rounded-xl border border-border/30 hover:border-border/60 transition-all duration-200'
        >
          <div className='flex items-center gap-4 flex-1'>
            <Avatar className='h-9 w-9 ring-2 ring-border/20'>
              <AvatarImage src={'/placeholder.svg'} />
              <AvatarFallback className='bg-primary/10 text-primary font-medium flex items-center justify-center w-full'>
                <User className='h-5 w-5' />
              </AvatarFallback>
            </Avatar>

            <div className='flex-1 space-y-1'>
              <div className='flex items-center justify-between gap-2'>
                <p className='font-medium text-foreground'>
                  {request.client_email}
                </p>

                <Badge
                  className='capitalize text-xs'
                  variant={
                    request.status === 'accepted'
                      ? 'default'
                      : request.status === 'pending'
                      ? 'secondary'
                      : 'outline'
                  }
                >
                  {request.status}
                </Badge>
              </div>
              <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                <Clock className='h-3 w-3' />
                <span>{getTimeAgo({ startDate: request.requested_at })}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RecentRequestsList;
