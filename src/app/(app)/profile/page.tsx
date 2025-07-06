'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import LoadingScreen from '@/components/ui/LoadingScreen';
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
      <CardHeader>
        <CardTitle className='text-3xl font-bold'>Your Account</CardTitle>
        <CardDescription>
          Manage your account and related preferences.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ProfileForm ref={profileRef} user={user} />
        <ResetOnboarding user={user} />
      </CardContent>
    </Card>
  );
}
