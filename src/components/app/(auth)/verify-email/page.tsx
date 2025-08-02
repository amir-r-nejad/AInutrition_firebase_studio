import LoadingScreen from '@/components/ui/LoadingScreen';
import VerifyEmailContent from '@/features/auth/components/signup/VerifyEmailContent';
import { Suspense } from 'react';

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={<LoadingScreen loadingLabel='Loading verification...' />}
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
