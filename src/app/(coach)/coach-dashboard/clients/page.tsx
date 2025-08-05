import { ClientsHeader } from '@/features/coach/components/clients/ClientsHeader';
import { ClientsFilterSection } from '@/features/coach/components/clients/ClientsFilterSection';
import { AcceptedClientsSection } from '@/features/coach/components/clients/AcceptedClientsSection';
import { Suspense } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function CoachClientsPage() {
  return (
    <div className='space-y-8 p-6'>
      <ClientsHeader />

      <ClientsFilterSection />

      <Suspense fallback={<LoadingScreen loadingLabel='Loading clients...' />}>
        <AcceptedClientsSection />
      </Suspense>
    </div>
  );
}
