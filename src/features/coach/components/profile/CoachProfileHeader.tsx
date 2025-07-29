import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDate } from 'date-fns';
import { Calendar } from 'lucide-react';

interface CoachHeaderData {
  full_name: string;
  email?: string;
  joined_date: string;
  certification: string[];
  avatar_url?: string;
}

export function CoachProfileHeader({ coach }: { coach: CoachHeaderData }) {
  return (
    <div className='flex items-start justify-between'>
      <div className='flex items-start gap-6'>
        <Avatar className='h-24 w-24'>
          <AvatarImage src={coach?.avatar_url} />
          <AvatarFallback className='bg-primary/10 text-primary font-medium text-2xl'>
            {coach.full_name.split(' ').at(0)?.[0]}
            {coach.full_name.split(' ').at(-1)?.[0]}
          </AvatarFallback>
        </Avatar>

        <div className='space-y-3'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>
              {coach.full_name}
            </h1>
            <p className='text-muted-foreground'>{coach.email || 'No email'}</p>
          </div>

          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
            <div className='flex items-center gap-1'>
              <Calendar className='h-4 w-4' />
              <span>
                Joined at{' '}
                {formatDate(new Date(coach.joined_date), 'MMMM dd, yyyy')}
              </span>
            </div>
            <Badge variant='default'>{coach.certification.join(', ')}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
