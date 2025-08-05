import { Card, CardContent } from '@/components/ui/card';
import SectionHeader from '@/components/ui/SectionHeader';
import { CoachClientDashboard } from '@/features/coach/components/client-dashboard/CoachClientDashboard';
import { ClientDashboardSkeleton } from '@/features/coach/components/loading/ClientDashboardSkeleton';
import { checkCoachAccess } from '@/lib/utils/access-control';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

interface CoachClientDashboardPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function CoachClientDashboardPage({
  params,
}: CoachClientDashboardPageProps) {
  const { clientId } = await params;
  const { hasAccess, isCoach } = await checkCoachAccess(clientId);

  if (!isCoach || !hasAccess) notFound();

  return (
    <div className='space-y-6'>
      <Card>
        <SectionHeader
          className='text-3xl font-bold'
          title='Client Dashboard'
          description="Monitor your client's nutrition progress and meal plans"
        />
        <CardContent>
          <Suspense fallback={<ClientDashboardSkeleton />}>
            <CoachClientDashboard clientId={clientId} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
