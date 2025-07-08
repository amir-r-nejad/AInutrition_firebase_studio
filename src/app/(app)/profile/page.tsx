'use client';

import { Card, CardContent } from '@/components/ui/card';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SectionHeader from '@/components/ui/SectionHeader';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import ProfileForm from '@/features/profile/components/ProfileForm';
import ResetOnboarding from '@/features/profile/components/ResetOnboarding';
import { ProfileFormHandle } from '@/features/profile/types';
import { useEffect, useRef } from 'react';

export default function ProfilePage() {
  const profileRef = useRef<ProfileFormHandle>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (profileRef.current) profileRef.current.refreshProfile();
  }, [profileRef.current?.form]);

  if (profileRef.current?.isLoading && user) return <LoadingScreen />;

  return (
    <Card className='max-w-xl mx-auto shadow-lg'>
      <SectionHeader
        className='text-3xl font-bold'
        title='Your Account'
        description='Manage your account and related preferences.'
      />

      <CardContent>
        <ProfileForm ref={profileRef} user={user} />
        <ResetOnboarding user={user} />
      </CardContent>
    </Card>
  );
}
