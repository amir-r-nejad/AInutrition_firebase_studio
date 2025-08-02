'use client';

import { CoachOnboardingForm } from '@/features/coach/components/onboarding/CoachOnboardingForm';
import ClientOnboardingForm from '@/features/auth/components/onboarding/ClientOnboardingForm';
import { useState } from 'react';
import { UserRoleSelection } from '@/features/coach/components/onboarding/UserRoleSelection';

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<'client' | 'coach' | null>(
    null
  );

  function handleRoleSelected(role: 'client' | 'coach') {
    setSelectedRole(role);
  }

  if (!selectedRole) {
    return <UserRoleSelection onRoleSelected={handleRoleSelected} />;
  }

  if (selectedRole === 'coach') {
    return <CoachOnboardingForm />;
  }

  return <ClientOnboardingForm />;
}
