import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';

function ClientsList({ clients }: { clients: any }) {
  return (
    <ul className='space-y-4'>
      {clients.map((client: any) => (
        <li
          key={client.user_id}
          className='flex flex-col lg:flex-row gap-5 lg:items-center justify-between p-4 rounded-lg border border-border/30 hover:border-border/60 transition-all duration-200 hover:shadow-sm'
        >
          <div className='flex items-center gap-4'>
            <Avatar className='h-12 w-12'>
              <AvatarImage src={client?.avatar_url} />
              <AvatarFallback className='bg-primary/10 text-primary font-medium'>
                {client.full_name.split(' ').at(0).at(0)}
                {client.full_name.split(' ').at(-1).at(0)}
              </AvatarFallback>
            </Avatar>

            <div className='space-y-2'>
              <div className='flex items-center gap-3'>
                <h4 className='font-medium text-foreground'>
                  {client.full_name}
                </h4>
              </div>

              <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                <span>{client.email}</span>
                <span>•</span>
                <span>{client.age} years old</span>
                <span>•</span>
                <span className='capitalize'>{client.biological_sex}</span>
              </div>

              <div className='flex items-center gap-3'>
                <span className='text-sm text-muted-foreground capitalize'>
                  Goal: {client.primary_diet_goal.split('_').join(' ')}
                </span>
              </div>

              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Calendar className='h-3 w-3' />
                <span>Joined {client.created_at}</span>
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

            {/* THIS WILL BE ADDED */}
            {/* <Button
              variant='ghost'
              size='sm'
              className='gap-2 border border-destructive hover:bg-destructive hover:text-primary-foreground text-destructive'
            >
              Remove client
              <Trash2 className='h-4 w-4' />
            </Button> */}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default ClientsList;
