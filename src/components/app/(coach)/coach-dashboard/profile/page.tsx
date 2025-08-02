import LoadingScreen from '@/components/ui/LoadingScreen';
import { CoachProfileSection } from '@/features/coach/components/CoachProfileSection';
import { Suspense } from 'react';

export default function CoachProfilePage() {
  return (
    <Suspense
      fallback={<LoadingScreen loadingLabel='Loading coach profile...' />}
    >
      <CoachProfileSection />
    </Suspense>
  );
}
