import { PendingRequestsSection } from '@/features/coach/components/requests/PendingRequestsSection';
import { RequestsHeader } from '@/features/coach/components/requests/RequestsHeader';

export default function CoachRequestsPage() {
  return (
    <div className='space-y-8'>
      <RequestsHeader />
      <PendingRequestsSection />
    </div>
  );
}
