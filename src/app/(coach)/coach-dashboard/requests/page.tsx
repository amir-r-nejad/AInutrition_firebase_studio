import { Card, CardContent } from '@/components/ui/card';
import SectionHeader from '@/components/ui/SectionHeader';
import { PendingRequestsSection } from '@/features/coach/components/requests/PendingRequestsSection';
import { RequestsHeader } from '@/features/coach/components/requests/RequestsHeader';
import { RequestsHeaderSkeleton } from '@/features/coach/components/loading/RequestsHeaderSkeleton';
import { RequestsListSkeleton } from '@/features/coach/components/loading/RequestsListSkeleton';
import { Suspense } from 'react';

export default function CoachRequestsPage() {
  return (
    <div className='space-y-6'>
      <Card>
        <SectionHeader
          className='text-3xl font-bold'
          title='Client Requests'
          description='Review and manage incoming client requests'
        />
        <CardContent className='space-y-6'>
          <Suspense fallback={<RequestsHeaderSkeleton />}>
            <RequestsHeader />
          </Suspense>

          <Suspense fallback={<RequestsListSkeleton />}>
            <PendingRequestsSection />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
