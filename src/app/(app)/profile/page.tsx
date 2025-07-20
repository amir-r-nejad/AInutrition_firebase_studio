import { Card, CardContent } from '@/components/ui/card';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SectionHeader from '@/components/ui/SectionHeader';
import ProfileSection from '@/features/profile/components/ProfileSection';
import ResetOnboarding from '@/features/profile/components/ResetOnboarding';
import { Suspense } from 'react';

export default function ProfilePage() {
  return (
    <Card className='max-w-xl mx-auto shadow-lg'>
      <SectionHeader
        className='text-3xl font-bold'
        title='Your Account'
        description='Manage your account and related preferences.'
      />

      <CardContent>
        <Suspense fallback={<LoadingScreen />}>
          <ProfileSection />
        </Suspense>

        <ResetOnboarding />
      </CardContent>
    </Card>
  );
}
