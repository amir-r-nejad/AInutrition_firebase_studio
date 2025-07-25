import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockPendingRequests } from '@/features/coach/lib/mockData';
import { Clock, X } from 'lucide-react';

export function PendingRequestsSection() {
  return (
    <Card className='border border-border/50'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-semibold'>
            Pending Requests
          </CardTitle>
          <Badge variant='secondary' className='text-xs'>
            {mockPendingRequests.length} pending
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-4'>
          {mockPendingRequests.map((request) => (
            <div
              key={request.user_id}
              className='flex items-center justify-between p-4 rounded-lg border border-border/30 hover:border-border/60 transition-colors duration-200'
            >
              <div className='flex items-center gap-4'>
                <Avatar className='h-12 w-12'>
                  <AvatarImage
                    src={request.profile_picture || '/placeholder.svg'}
                  />
                  <AvatarFallback className='bg-primary/10 text-primary font-medium'>
                    {request.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>

                <div className='space-y-1'>
                  <h4 className='font-medium text-foreground'>
                    {request.full_name}
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    {request.email_address}
                  </p>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <Clock className='h-3 w-3' />
                    <span>Sent {request.sent_date}</span>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className='text-xs bg-yellow-50 text-yellow-700 border-yellow-200'
                >
                  Pending
                </Badge>
                <Button
                  variant='outline'
                  size='sm'
                  className='gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 bg-transparent'
                >
                  <X className='h-4 w-4' />
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
