import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPendingClientRequests } from '../../lib/data-service';
import RequestsList from './RequestsList';
import { Suspense } from 'react';
import EmptyState from '@/components/ui/EmptyState';
import { MailOpen } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import ErrorMessage from '@/components/ui/ErrorMessage';

export async function PendingRequestsSection() {
  noStore();
  const pendingRequests = await getPendingClientRequests();

  try {
    if (!pendingRequests || pendingRequests.length === 0)
      return (
        <EmptyState
          icon={MailOpen}
          title='No Pending Requests'
          description="You don't have any pending client requests at the moment. Share your coaching profile or send requests to potential clients."
        />
      );

    return (
      <Card className='border border-border/50'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg font-semibold'>
              Pending Requests
            </CardTitle>
            <Badge variant='secondary' className='text-xs'>
              {pendingRequests.length} pending
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <Suspense fallback={<p>Loading...</p>}>
            <RequestsList requests={pendingRequests} />
          </Suspense>
        </CardContent>
      </Card>
    );
  } catch (error) {
    return (
      <ErrorMessage
        title='Failed to Load Pending Requests'
        message={
          error instanceof Error
            ? error.message
            : 'Something went wrong while fetching pending client requests. Please try again.'
        }
      />
    );
  }
}
