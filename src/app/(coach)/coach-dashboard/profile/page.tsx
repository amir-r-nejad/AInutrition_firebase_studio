import { Card, CardContent } from '@/components/ui/card';
import SectionHeader from '@/components/ui/SectionHeader';
import { CoachProfileSection } from '@/features/coach/components/CoachProfileSection';
import { CoachProfileSkeleton } from '@/features/coach/components/loading/CoachProfileSkeleton';
import { Suspense } from 'react';

export default function CoachProfilePage() {
  return (
    <div className='space-y-6'>
      <Card>
        <SectionHeader
          className='text-3xl font-bold'
          title='Coach Profile'
          description='Manage your professional profile and credentials'
        />
        <CardContent>
          <Suspense fallback={<CoachProfileSkeleton />}>
            <CoachProfileSection />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
