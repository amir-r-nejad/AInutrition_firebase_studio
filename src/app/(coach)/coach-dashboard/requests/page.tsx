import PageLoadingSpinner from '@/components/ui/PageLoadingSpinner';
import { PendingRequestsSection } from '@/features/coach/components/requests/PendingRequestsSection';
import { RequestsHeader } from '@/features/coach/components/requests/RequestsHeader';
import { Suspense } from 'react';

export default async function CoachRequestsPage() {
  return (
    <div className='space-y-8'>
      <Suspense
        fallback={<PageLoadingSpinner message='Loading requests header...' />}
      >
        <RequestsHeader />
      </Suspense>
      <Suspense
        fallback={<PageLoadingSpinner message='Loading requests ...' />}
      >
        <PendingRequestsSection />
      </Suspense>
    </div>
  );
}
