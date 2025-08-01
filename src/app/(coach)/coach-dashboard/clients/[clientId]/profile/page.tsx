import { Card, CardContent } from '@/components/ui/card';
import PageLoadingSpinner from '@/components/ui/PageLoadingSpinner';
import SectionHeader from '@/components/ui/SectionHeader';
import ProfileSection from '@/features/profile/components/ProfileSection';
import { checkCoachAccess } from '@/lib/utils/access-control';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

type CoachClientProfilePageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function CoachClientProfilePage({
  params,
}: CoachClientProfilePageProps) {
  const { clientId } = await params;
  const { hasAccess, isCoach } = await checkCoachAccess(clientId);

  if (!isCoach || !hasAccess) notFound();

  return (
    <div className='container mx-auto py-8'>
      <Card className='shadow-xl'>
        <SectionHeader
          className='text-3xl font-bold'
          title="Client's Profile"
          description="View your client's health profile and nutrition goals"
        />
        <CardContent>
          <Suspense
            fallback={
              <PageLoadingSpinner message="Loading client's profile..." />
            }
          >
            <ProfileSection clientId={clientId} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
