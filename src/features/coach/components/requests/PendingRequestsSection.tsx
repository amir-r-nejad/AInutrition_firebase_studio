import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPendingClientRequests } from '../../lib/data-service';
import RequestsList from './RequestsList';
import { Suspense } from 'react';

export async function PendingRequestsSection() {
  const pendingRequests = await getPendingClientRequests();
  if (!pendingRequests?.length) return <p>No pending requests</p>;

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
}
