import { Card, CardContent } from '@/components/ui/card';
import SectionHeader from '@/components/ui/SectionHeader';
import { AcceptedClientsSection } from '@/features/coach/components/clients/AcceptedClientsSection';
import { ClientsFilterSection } from '@/features/coach/components/clients/ClientsFilterSection';
import { ClientsHeader } from '@/features/coach/components/clients/ClientsHeader';
import { ClientsHeaderSkeleton } from '@/features/coach/components/loading/ClientsHeaderSkeleton';
import { ClientsFilterSkeleton } from '@/features/coach/components/loading/ClientsFilterSkeleton';
import { ClientsListSkeleton } from '@/features/coach/components/loading/ClientsListSkeleton';
import { Suspense } from 'react';

export default function CoachClientsPage() {
  return (
    <div className='space-y-6'>
      <Card>
        <SectionHeader
          className='text-3xl font-bold'
          title='My Clients'
          description='Manage and monitor your accepted clients'
        />
        <CardContent className='space-y-6'>
          <Suspense fallback={<ClientsHeaderSkeleton />}>
            <ClientsHeader />
          </Suspense>

          <Suspense fallback={<ClientsFilterSkeleton />}>
            <ClientsFilterSection />
          </Suspense>

          <Suspense fallback={<ClientsListSkeleton />}>
            <AcceptedClientsSection />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
