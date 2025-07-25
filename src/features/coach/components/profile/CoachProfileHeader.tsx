import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { mockCoachProfile } from '@/features/coach/lib/mockData';
import { Calendar } from 'lucide-react';

export function CoachProfileHeader() {
  return (
    <div className='flex items-start justify-between'>
      <div className='flex items-start gap-6'>
        <Avatar className='h-24 w-24'>
          <AvatarImage
            src={mockCoachProfile.profile_picture || '/placeholder.svg'}
          />
          <AvatarFallback className='bg-primary/10 text-primary font-medium text-2xl'>
            {mockCoachProfile.first_name[0]}
            {mockCoachProfile.last_name[0]}
          </AvatarFallback>
        </Avatar>

        <div className='space-y-3'>
          <div>
            <h1 className='text-2xl font-bold text-foreground'>
              {mockCoachProfile.first_name} {mockCoachProfile.last_name}
            </h1>
            <p className='text-muted-foreground'>
              {mockCoachProfile.email_address}
            </p>
          </div>

          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
            <div className='flex items-center gap-1'>
              <Calendar className='h-4 w-4' />
              <span>Joined {mockCoachProfile.joined_date}</span>
            </div>
            <Badge variant='default'>{mockCoachProfile.certification}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
