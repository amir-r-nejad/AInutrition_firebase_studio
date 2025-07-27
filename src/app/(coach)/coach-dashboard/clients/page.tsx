import { AcceptedClientsSection } from '@/features/coach/components/clients/AcceptedClientsSection';
import { ClientsHeader } from '@/features/coach/components/clients/ClientsHeader';

export default function CoachClientsPage() {
  return (
    <div className='space-y-8'>
      <ClientsHeader />
      {/* WILL BE ADDED IN THE FUTURE */}
      {/* <ClientsFilterSection /> */}
      <AcceptedClientsSection />
    </div>
  );
}
