'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useQueryParams } from '@/hooks/useQueryParams';
import { getTimeAgo } from '@/lib/utils';
import { Clock } from 'lucide-react';

type RequestType = {
  requests: {
    status: 'pending';
    requested_at: Date;
    client_email: string;
    id: string;
  }[];
};

function RequestsList({ requests }: RequestType) {
  const { getQueryParams } = useQueryParams();

  const searchedClient = getQueryParams('client');
  const searchedReq = searchedClient
    ? requests.filter((request) =>
        request.client_email.includes(searchedClient)
      )
    : requests;

  if (searchedReq.length <= 0) return <p>No requests found</p>;

  return (
    <ul className='space-y-4'>
      {searchedReq.map((request) => {
        return (
          <li
            key={request.id}
            className='flex items-center justify-between p-4 rounded-lg border border-border/30 hover:border-border/60 transition-colors duration-200'
          >
            <div className='flex items-center gap-4'>
              <Avatar className='h-12 w-12'>
                <AvatarImage src={'/placeholder.svg'} />
                <AvatarFallback className='bg-primary/10 text-primary font-medium'>
                  {request.client_email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>
                  {request.client_email}
                </p>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <Clock className='h-3 w-3' />
                  <span>
                    Sent{' '}
                    {getTimeAgo({
                      startDate: request.requested_at,
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Badge
                variant='outline'
                className='text-xs bg-yellow-50 text-yellow-700 border-yellow-200 capitalize'
              >
                {request.status}
              </Badge>

              {/* WILL BE ADDED */}
              {/* <Button
                variant='outline'
                size='sm'
                className='gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 bg-transparent'
              >
                <X className='h-4 w-4' />
                Cancel
              </Button> */}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default RequestsList;
