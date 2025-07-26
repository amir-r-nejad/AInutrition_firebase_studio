import { PendingRequestsSection } from '@/features/coach/components/requests/PendingRequestsSection';
import { RequestsHeader } from '@/features/coach/components/requests/RequestsHeader';
import { Suspense } from 'react';

export default function CoachRequestsPage() {
  return (
    <div className='space-y-8'>
      <Suspense fallback={<p>Loading...</p>}>
        <RequestsHeader />
      </Suspense>
      <PendingRequestsSection />
    </div>
  );
}
