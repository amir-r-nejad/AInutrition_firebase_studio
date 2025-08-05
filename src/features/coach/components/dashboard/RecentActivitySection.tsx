import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/EmptyState';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { Activity, ArrowRight } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { getRecentCoachClientRequests } from '../../lib/data-service';
import RecentRequestsList from './RecentRequestsList';
import SectionHeader from '@/components/ui/SectionHeader';

export async function RecentActivitySection() {
  noStore();

  try {
    const recentRequests = await getRecentCoachClientRequests();

    return (
      <Card className='border border-border/50'>
        <SectionHeader
          headerClassName='grid grid-cols-2'
          description='Latest client requests and interactions'
          title='Recent Activity'
          icon={<Activity className='h-5 w-5 text-primary' />}
        >
          <Link href='/coach-dashboard/requests' className='justify-self-end'>
            <Button variant='ghost' size='sm'>
              View All
              <ArrowRight className='h-4 w-4 ml-1' />
            </Button>
          </Link>
        </SectionHeader>

        <CardContent>
          {!recentRequests || recentRequests.length === 0 ? (
            <EmptyState
              icon={Activity}
              title='No Recent Activity'
              description="You're all caught up! Once there's client activity, it'll appear here."
            />
          ) : (
            <RecentRequestsList recentRequests={recentRequests} />
          )}
        </CardContent>
      </Card>
    );
  } catch (error) {
    return (
      <Card className='border border-border/50'>
        <CardHeader>
          <CardTitle className='text-xl font-semibold flex items-center gap-2'>
            <div className='p-2 bg-primary/10 rounded-lg'>
              <Activity className='h-5 w-5 text-primary' />
            </div>
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorMessage
            title='Something Went Wrong'
            message={
              error instanceof Error
                ? error.message
                : "We couldn't load the recent activity. Please try again later or refresh the page."
            }
          />
        </CardContent>
      </Card>
    );
  }
}
