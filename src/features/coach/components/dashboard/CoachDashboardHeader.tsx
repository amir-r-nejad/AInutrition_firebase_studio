import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import SectionHeader from '@/components/ui/SectionHeader';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import { getCoachProfile } from '../../lib/data-service';

export async function CoachDashboardHeader() {
  noStore();

  const coach = await getCoachProfile();
  const [firstName, lastName] = coach.full_name.split(' ');

  return (
    <Card className='pb-5 lg:pb-0'>
      <div className='flex flex-col lg:flex-row justify-between lg:items-center items-start'>
        <SectionHeader
          icon={
            <div className='relative'>
              <Avatar className='size-12 ring-2 ring-primary/10'>
                <AvatarImage src={coach.avatar_url || '/placeholder.svg'} />
                <AvatarFallback className='bg-primary/20 text-primary font-semibold text-xl'>
                  {firstName[0]}
                  {lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className='absolute -bottom-1 -right-1 size-4 bg-primary rounded-full border-4 border-white'></div>
            </div>
          }
          className='text-3xl font-bold text-foreground'
          title={`Welcome back, ${firstName}!`}
          description='Ready to help your clients achieve their nutrition goals today?'
        />

        <div className='flex flex-row-reverse lg:flex-col lg:items-end items-center gap-2 text-sm text-muted-foreground px-6'>
          <Badge variant='default' className='text-sm px-3 py-1 font-medium'>
            {coach.certification.join(', ')}
          </Badge>

          <div className='flex gap-2 items-center'>
            <div className='flex items-center gap-1'>
              <Calendar className='size-3' />
              <span>{format(new Date(), 'MMM dd, yyyy')}</span>
            </div>
            <div className='flex items-center gap-1'>
              <Clock className='size-3' />
              <span>{format(new Date(), 'HH:mm')}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
