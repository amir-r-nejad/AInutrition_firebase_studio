import LoadingScreen from '@/components/ui/LoadingScreen';
import { AcceptedClientsSection } from '@/features/coach/components/clients/AcceptedClientsSection';
import { ClientsHeader } from '@/features/coach/components/clients/ClientsHeader';
import { Suspense } from 'react';

export default function CoachClientsPage() {
  return (
    <div className='space-y-8'>
      {/* WILL BE ADDED IN THE FUTURE */}
      {/* <ClientsFilterSection /> */}
      <ClientsHeader />
      <Suspense
        fallback={<LoadingScreen loadingLabel='Loading accepted clients...' />}
      >
        <AcceptedClientsSection />
      </Suspense>
    </div>
  );
}
