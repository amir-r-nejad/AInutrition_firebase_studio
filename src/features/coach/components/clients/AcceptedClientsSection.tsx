import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockAcceptedClients } from '@/features/coach/lib/mockData';
import { Calendar, ExternalLink, Trash2 } from 'lucide-react';
import Link from 'next/link';

export function AcceptedClientsSection() {
  return (
    <Card className='border border-border/50'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-semibold'>
            Accepted Clients
          </CardTitle>
          <Badge variant='default' className='text-xs'>
            {mockAcceptedClients.length} clients
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {mockAcceptedClients.map((client) => (
            <div
              key={client.user_id}
              className='flex flex-col lg:flex-row gap-5 lg:items-center justify-between p-4 rounded-lg border border-border/30 hover:border-border/60 transition-all duration-200 hover:shadow-sm'
            >
              <div className='flex items-center gap-4'>
                <Avatar className='h-12 w-12'>
                  <AvatarImage
                    src={client.profile_picture || '/placeholder.svg'}
                  />
                  <AvatarFallback className='bg-primary/10 text-primary font-medium'>
                    {client.first_name[0]}
                    {client.last_name[0]}
                  </AvatarFallback>
                </Avatar>

                <div className='space-y-2'>
                  <div className='flex items-center gap-3'>
                    <h4 className='font-medium text-foreground'>
                      {client.first_name} {client.last_name}
                    </h4>
                    <Badge
                      variant={
                        client.status === 'active' ? 'default' : 'secondary'
                      }
                      className='text-xs'
                    >
                      {client.status}
                    </Badge>
                  </div>

                  <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                    <span>{client.email_address}</span>
                    <span>•</span>
                    <span>{client.age} years old</span>
                    <span>•</span>
                    <span className='capitalize'>{client.gender}</span>
                  </div>

                  <div className='flex items-center gap-3'>
                    <span className='text-sm text-muted-foreground'>
                      Goal: {client.current_goal}
                    </span>
                    <div className='flex items-center gap-2'>
                      <Progress
                        value={client.progress_score}
                        className='w-20 h-2'
                      />
                      <span className='text-xs text-muted-foreground'>
                        {client.progress_score}%
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <Calendar className='h-3 w-3' />
                    <span>
                      Joined {client.joined_date} • Last active{' '}
                      {client.last_activity}
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <Link href={`/coach-dashboard/clients/${client.user_id}`}>
                  <Button
                    variant='outline'
                    size='sm'
                    className='gap-2 bg-transparent'
                  >
                    <ExternalLink className='h-4 w-4' />
                    View Dashboard
                  </Button>
                </Link>

                <Button
                  variant='ghost'
                  size='sm'
                  className='gap-2 border border-destructive hover:bg-destructive hover:text-primary-foreground text-destructive'
                >
                  Remove client
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
