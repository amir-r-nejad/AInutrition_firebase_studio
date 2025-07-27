import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockClientRequests } from '@/features/coach/lib/mockData';
import { Check, Clock, Mail, X } from 'lucide-react';

export function ClientRequestsSection() {
  return (
    <Card className='border border-border/50'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-semibold'>
            Client Requests
          </CardTitle>
          <Badge variant='secondary' className='text-xs'>
            {mockClientRequests.length} pending
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-4'>
          {mockClientRequests.map((request) => (
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
                    <span>Requested {request.request_date}</span>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 bg-transparent'
                >
                  <X className='h-4 w-4' />
                  Decline
                </Button>
                <Button size='sm' className='gap-2'>
                  <Check className='h-4 w-4' />
                  Accept
                </Button>
                <Button variant='ghost' size='sm' className='gap-2'>
                  <Mail className='h-4 w-4' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
