import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getCoachProfile } from '../../lib/data-service';
import { unstable_noStore as noStore } from 'next/cache';

export async function CoachDashboardHeader() {
  noStore();

  const coach = await getCoachProfile();
  const [firstName, lastName] = coach.full_name.split(' ');

  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-4'>
        <Avatar className='h-16 w-16'>
          <AvatarImage src={coach.avatar_url || '/placeholder.svg'} />
          <AvatarFallback className='bg-primary/10 text-primary font-medium text-lg'>
            {firstName[0]} {lastName[0]}
          </AvatarFallback>
        </Avatar>

        <div className='space-y-1'>
          <h1 className='text-2xl font-bold text-foreground'>
            Welcome back, {firstName}!
          </h1>
          <p className='text-muted-foreground'>
            Here&apos;s what&apos;s happening with your coaching practice today.
          </p>
        </div>
      </div>

      <Badge variant='default' className='text-sm hidden lg:block'>
        {coach.certification.join(', ')}
      </Badge>
    </div>
  );
}
